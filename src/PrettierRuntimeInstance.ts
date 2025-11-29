import { spawn, ChildProcess } from "child_process";
import { FileInfoOptions, Options, ResolveConfigOptions } from "prettier";
import { PrettierInstance } from "./PrettierInstance";
import {
  PrettierFileInfoResult,
  PrettierPlugin,
  PrettierSupportLanguage,
} from "./types";

let currentCallId = 0;

interface RPCRequest {
  id: number;
  type: "import" | "callMethod";
  payload: {
    modulePath?: string;
    methodName?: string;
    methodArgs?: unknown[];
  };
}

interface RPCResponse {
  id: number;
  type: "import" | "callMethod";
  payload: {
    version?: string;
    result?: unknown;
    isError?: boolean;
    error?: string;
  };
}

/**
 * PrettierRuntimeInstance executes Prettier using a custom JavaScript runtime
 * (like Bun or Deno) instead of Node.js. It spawns a child process with the
 * specified runtime and communicates with it via JSON-RPC over stdin/stdout.
 */
export class PrettierRuntimeInstance implements PrettierInstance {
  public version: string | null = null;
  private process: ChildProcess | null = null;
  private messageResolvers: Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (value: unknown) => void;
    }
  > = new Map();
  private buffer = "";

  constructor(
    private modulePath: string,
    private runtimeExecutable: string,
  ) {}

  private async ensureProcess(): Promise<void> {
    if (this.process) {
      return;
    }

    // Create a wrapper script that acts as an RPC server
    // Note: This uses CommonJS require() which works with Node.js and Bun.
    // Deno users would need to enable --allow-read and CommonJS compatibility.
    const workerCode = `
const prettier = require(${JSON.stringify(this.modulePath)});

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  const lines = chunk.split('\\n');
  lines.forEach((line) => {
    if (!line.trim()) return;
    try {
      const message = JSON.parse(line);
      handleMessage(message);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });
});

function handleMessage(message) {
  const { id, type, payload } = message;
  
  switch (type) {
    case 'import': {
      try {
        process.stdout.write(JSON.stringify({
          id,
          type,
          payload: { version: prettier.version }
        }) + '\\n');
      } catch (error) {
        process.stdout.write(JSON.stringify({
          id,
          type,
          payload: { version: null, error: error.message }
        }) + '\\n');
      }
      break;
    }
    case 'callMethod': {
      const { methodName, methodArgs } = payload;
      try {
        const result = prettier[methodName](...methodArgs);
        if (result instanceof Promise) {
          result.then((value) => {
            // For prettier-vscode, languages are enough for getSupportInfo
            if (methodName === 'getSupportInfo' && value) {
              value = { languages: value.languages };
            }
            process.stdout.write(JSON.stringify({
              id,
              type,
              payload: { result: value, isError: false }
            }) + '\\n');
          }).catch((reason) => {
            process.stdout.write(JSON.stringify({
              id,
              type,
              payload: { result: reason, isError: true, error: reason.message }
            }) + '\\n');
          });
        } else {
          // For prettier-vscode, languages are enough for getSupportInfo
          let finalResult = result;
          if (methodName === 'getSupportInfo' && result) {
            finalResult = { languages: result.languages };
          }
          process.stdout.write(JSON.stringify({
            id,
            type,
            payload: { result: finalResult, isError: false }
          }) + '\\n');
        }
      } catch (error) {
        process.stdout.write(JSON.stringify({
          id,
          type,
          payload: { result: error, isError: true, error: error.message }
        }) + '\\n');
      }
      break;
    }
  }
}

// Keep process alive
process.stdin.resume();
`;

    // Spawn the process with the specified runtime
    this.process = spawn(this.runtimeExecutable, ["-e", workerCode], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle stdout messages
    this.process.stdout!.on("data", (chunk) => {
      this.buffer += chunk.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response: RPCResponse = JSON.parse(line);
          this.handleResponse(response);
        } catch {
          // Ignore malformed responses - they may be partial JSON that will
          // be completed in the next chunk. If they represent a real error,
          // the process will exit and pending promises will be rejected.
        }
      }
    });

    // Capture stderr for potential error diagnostics
    // Most runtimes use stderr for their own diagnostics
    let stderrBuffer = "";
    this.process.stderr!.on("data", (chunk) => {
      stderrBuffer += chunk.toString();
      // Keep only last 1000 chars to avoid memory issues
      if (stderrBuffer.length > 1000) {
        stderrBuffer = stderrBuffer.slice(-1000);
      }
    });

    // Handle process exit
    this.process.on("exit", (code) => {
      this.process = null;
      // Reject all pending promises with detailed error message
      let errorMessage = `Runtime process exited with code ${code}`;
      if (stderrBuffer.trim()) {
        errorMessage += `\nStderr: ${stderrBuffer.trim()}`;
      }
      for (const resolver of this.messageResolvers.values()) {
        resolver.reject(new Error(errorMessage));
      }
      this.messageResolvers.clear();
    });
  }

  private handleResponse(response: RPCResponse): void {
    const resolver = this.messageResolvers.get(response.id);
    if (!resolver) {
      return;
    }

    this.messageResolvers.delete(response.id);

    switch (response.type) {
      case "import": {
        if (response.payload.version) {
          this.version = response.payload.version;
          resolver.resolve(response.payload.version);
        } else {
          resolver.reject(
            new Error(response.payload.error || "Failed to import Prettier"),
          );
        }
        break;
      }
      case "callMethod": {
        if (response.payload.isError) {
          resolver.reject(
            new Error(response.payload.error || "Method call failed"),
          );
        } else {
          resolver.resolve(response.payload.result);
        }
        break;
      }
    }
  }

  private async sendMessage(message: RPCRequest): Promise<unknown> {
    await this.ensureProcess();

    const promise = new Promise((resolve, reject) => {
      this.messageResolvers.set(message.id, { resolve, reject });
    });

    this.process!.stdin!.write(JSON.stringify(message) + "\n");

    return promise;
  }

  public async import(): Promise<string> {
    const callId = currentCallId++;
    const result = await this.sendMessage({
      id: callId,
      type: "import",
      payload: { modulePath: this.modulePath },
    });
    return result as string;
  }

  public async format(
    source: string,
    options?: Options | undefined,
  ): Promise<string> {
    const callId = currentCallId++;
    const result = await this.sendMessage({
      id: callId,
      type: "callMethod",
      payload: {
        methodName: "format",
        methodArgs: [source, options],
      },
    });
    return result as string;
  }

  public async getFileInfo(
    filePath: string,
    fileInfoOptions?: FileInfoOptions | undefined,
  ): Promise<PrettierFileInfoResult> {
    const callId = currentCallId++;
    const result = await this.sendMessage({
      id: callId,
      type: "callMethod",
      payload: {
        methodName: "getFileInfo",
        methodArgs: [filePath, fileInfoOptions],
      },
    });
    return result as PrettierFileInfoResult;
  }

  public async getSupportInfo({
    plugins,
  }: {
    plugins: (string | PrettierPlugin)[];
  }): Promise<{
    languages: PrettierSupportLanguage[];
  }> {
    const callId = currentCallId++;
    const result = await this.sendMessage({
      id: callId,
      type: "callMethod",
      payload: {
        methodName: "getSupportInfo",
        methodArgs: [{ plugins }],
      },
    });
    return result as { languages: PrettierSupportLanguage[] };
  }

  public async clearConfigCache(): Promise<void> {
    const callId = currentCallId++;
    await this.sendMessage({
      id: callId,
      type: "callMethod",
      payload: {
        methodName: "clearConfigCache",
        methodArgs: [],
      },
    });
  }

  public async resolveConfigFile(
    filePath?: string | undefined,
  ): Promise<string | null> {
    const callId = currentCallId++;
    const result = await this.sendMessage({
      id: callId,
      type: "callMethod",
      payload: {
        methodName: "resolveConfigFile",
        methodArgs: [filePath],
      },
    });
    return result as string | null;
  }

  public async resolveConfig(
    fileName: string,
    options?: ResolveConfigOptions | undefined,
  ): Promise<Options | null> {
    const callId = currentCallId++;
    const result = await this.sendMessage({
      id: callId,
      type: "callMethod",
      payload: {
        methodName: "resolveConfig",
        methodArgs: [fileName, options],
      },
    });
    return result as Options | null;
  }

  public dispose(): void {
    // Reject all pending promises before cleanup
    for (const resolver of this.messageResolvers.values()) {
      resolver.reject(new Error("PrettierRuntimeInstance disposed"));
    }
    this.messageResolvers.clear();

    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
