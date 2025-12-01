import { spawn, type SpawnOptions } from "child_process";

export interface ExecOptions extends SpawnOptions {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Execute a command asynchronously and return stdout.
 * Provides proper timeout handling and process cleanup.
 *
 * @param command The command to run
 * @param args Command arguments
 * @param options Execution options
 * @returns Promise resolving to stdout trimmed string
 */
export async function execAsync(
  command: string,
  args: string[],
  options: ExecOptions = {},
): Promise<string> {
  const { timeout = 10000, ...spawnOptions } = options;

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      shell: process.platform === "win32",
      ...spawnOptions,
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    const timeoutId = setTimeout(() => {
      killed = true;
      proc.kill("SIGTERM");
      reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
    }, timeout);

    proc.stdout?.on("data", (data) => {
      stdout += data;
    });

    proc.stderr?.on("data", (data) => {
      stderr += data;
    });

    proc.on("close", (code) => {
      clearTimeout(timeoutId);
      if (killed) return; // Already rejected via timeout

      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(
          new Error(
            stderr.trim() ||
              `Command failed with exit code ${code}: ${command}`,
          ),
        );
      }
    });

    proc.on("error", (error) => {
      clearTimeout(timeoutId);
      if (!killed) {
        reject(error);
      }
    });
  });
}
