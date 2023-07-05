import { fileURLToPath, URL } from "url";
import { ChildProcess, fork, ForkOptions } from "child_process";
import { EventEmitter } from "events";

const alive = (child: ChildProcess): boolean => {
  try {
    return !!process.kill(child.pid!, 0);
  } catch (e: any) {
    if (e.code === "EPERM" || e.code === "ESRCH") {
      return false;
    }
    throw e;
  }
};

const kill = async (child: ChildProcess) => {
  if (!alive(child)) {
    return;
  }
  return new Promise((resolve) => {
    let timeout: NodeJS.Timeout | null = null;
    child.once("exit", () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      resolve(undefined);
    });
    child.kill("SIGINT");
    timeout = setTimeout(() => {
      child.kill("SIGTERM");
      timeout = null;
    }, 3000);
  });
};

export class ChildProcessWorker {
  #process: ChildProcess | null = null;
  #url: URL;
  #processOptions: ForkOptions;
  #events: EventEmitter;
  #queue: any[];
  #exitCode: number | null = null;

  constructor(url: URL, processOptions: ForkOptions) {
    this.#url = url;
    this.#processOptions = processOptions;
    this.#events = new EventEmitter();
    this.#queue = [];
    void Promise.resolve().then(() => this.startProcess());
  }

  startProcess() {
    try {
      const stderr: Buffer[] = [];
      const stdout: Buffer[] = [];
      this.#process = fork(fileURLToPath(this.#url), [], {
        ...this.#processOptions,
        stdio: ["pipe", "pipe", "pipe", "ipc"],
      });
      this.#process.stderr?.on("data", (chunk) => {
        stderr.push(chunk);
      });
      this.#process.stdout?.on("data", (chunk) => {
        stdout.push(chunk);
      });
      this.#process
        .on("error", (err) => {
          this.#process = null;
          this.#exitCode = -1;
          this.#events.emit("error", err);
        })
        .on("exit", (code) => {
          this.#process = null;
          this.#exitCode = code;
          const stdoutResult = Buffer.concat(stdout).toString("utf8");
          const stderrResult = Buffer.concat(stderr).toString("utf8");
          if (code !== 0) {
            this.#events.emit(
              "error",
              new Error(
                `Process crashed with code ${code}: ${stdoutResult} ${stderrResult}`
              )
            );
          } else {
            this.#events.emit(
              "error",
              new Error(
                `Process unexpectedly exit:  ${stdoutResult} ${stderrResult}`
              )
            );
          }
        })
        .on("message", (msg) => {
          this.#events.emit("message", msg);
        });
      this.flushQueue();
    } catch (err) {
      this.#process = null;
      this.#events.emit("error", err);
    }
  }

  on(evt: string, fn: (payload: any) => void) {
    if (evt === "message" || evt === "error") {
      this.#events.on(evt, fn);
      return;
    }
    throw new Error(`Unsupported event ${evt}.`);
  }

  async terminate(): Promise<number> {
    if (!this.#process) {
      return this.#exitCode ?? -1;
    }
    await kill(this.#process);
    return this.#exitCode ?? -1;
  }

  flushQueue() {
    if (!this.#process) {
      return;
    }
    let items = 0;
    for (const entry of this.#queue) {
      if (!this.#process.send(entry)) {
        break;
      }
      items++;
    }
    if (items > 0) {
      this.#queue.splice(0, items);
    }
  }

  postMessage(data: any) {
    this.flushQueue();
    if (this.#process) {
      if (this.#process.send(data)) {
        return true;
      } else {
        this.#queue.push(data);
      }
    }
    this.#queue.push(data);
    return false;
  }
}
