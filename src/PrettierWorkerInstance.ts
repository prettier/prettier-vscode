import { Worker } from "worker_threads";
import * as url from "url";
import * as path from "path";
import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  PrettierOptions,
  PrettierPlugin,
  PrettierSupportLanguage,
} from "./types";
import { ChildProcessWorker } from "./ChildProcessWorker";
import {
  PrettierInstance,
  PrettierInstanceConstructor,
  PrettierInstanceContext,
} from "./PrettierInstance";
import { ResolveConfigOptions, Options } from "prettier";

const processWorker = url.pathToFileURL(
  path.join(__dirname, "/worker/prettier-instance-worker-process.js")
);
const threadWorker = url.pathToFileURL(
  path.join(__dirname, "/worker/prettier-instance-worker-process-thread.js")
);

export const PrettierWorkerInstance: PrettierInstanceConstructor = class PrettierWorkerInstance
  implements PrettierInstance
{
  private importResolver: {
    resolve: (version: string) => void;
    reject: (version: string) => void;
  } | null = null;

  private callMethodResolvers: Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (value: unknown) => void;
    }
  > = new Map();

  private worker: ChildProcessWorker | Worker | null = null;
  private currentCallMethodId = 0;

  public version: string | null = null;

  constructor(
    private modulePath: string,
    private context: PrettierInstanceContext
  ) {
    this.createWorker();
  }

  private createWorker() {
    const worker = this.context.config.runtime
      ? new ChildProcessWorker(processWorker, {
          execPath: this.context.config.runtime,
        })
      : new Worker(threadWorker);

    worker.on("message", ({ type, payload }) => {
      switch (type) {
        case "import": {
          this.importResolver?.resolve(payload.version);
          this.version = payload.version;
          break;
        }
        case "callMethod": {
          const resolver = this.callMethodResolvers.get(payload.id);
          this.callMethodResolvers.delete(payload.id);
          if (resolver) {
            if (payload.isError) {
              resolver.reject(payload.result);
            } else {
              resolver.resolve(payload.result);
            }
          }
          break;
        }
      }
    });
    worker.on("error", async (err) => {
      this.worker = null;
      this.context.loggingService.logInfo(
        `Worker error ${err.message}`,
        err.stack
      );
      await worker.terminate();
      this.createWorker();
    });

    this.worker = worker;
  }

  public async import(): Promise</* version of imported prettier */ string> {
    if (!this.worker) {
      throw new Error("Worker not available.");
    }
    const promise = new Promise<string>((resolve, reject) => {
      this.importResolver = { resolve, reject };
    });
    this.worker.postMessage({
      type: "import",
      payload: { modulePath: this.modulePath },
    });
    return promise;
  }

  public async format(
    source: string,
    options?: PrettierOptions
  ): Promise<string> {
    const result = await this.callMethod("format", [source, options]);
    return result;
  }

  public async getSupportInfo({
    plugins,
  }: {
    plugins: (string | PrettierPlugin)[];
  }): Promise<{
    languages: PrettierSupportLanguage[];
  }> {
    const result = await this.callMethod("getSupportInfo", [{ plugins }]);
    return result;
  }

  public async clearConfigCache(): Promise<void> {
    await this.callMethod("clearConfigCache", []);
  }

  public async getFileInfo(
    filePath: string,
    fileInfoOptions?: PrettierFileInfoOptions
  ): Promise<PrettierFileInfoResult> {
    const result = await this.callMethod("getFileInfo", [
      filePath,
      fileInfoOptions,
    ]);
    return result;
  }

  public async resolveConfigFile(
    filePath?: string | undefined
  ): Promise<string | null> {
    const result = await this.callMethod("resolveConfigFile", [filePath]);
    return result;
  }

  public async resolveConfig(
    fileName: string,
    options?: ResolveConfigOptions | undefined
  ): Promise<Options> {
    const result = await this.callMethod("resolveConfig", [fileName, options]);
    return result;
  }

  private callMethod(methodName: string, methodArgs: unknown[]): Promise<any> {
    if (!this.worker) {
      throw new Error("Worker not available.");
    }
    const callMethodId = this.currentCallMethodId++;
    const promise = new Promise((resolve, reject) => {
      this.callMethodResolvers.set(callMethodId, { resolve, reject });
    });
    this.worker.postMessage({
      type: "callMethod",
      payload: {
        id: callMethodId,
        modulePath: this.modulePath,
        methodName,
        methodArgs,
      },
    });
    return promise;
  }
};
