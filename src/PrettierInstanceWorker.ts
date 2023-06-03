import { Worker } from "worker_threads";

const worker = new Worker("./worker/prettier-instance-worker.js");

export class PrettierWorkerInstance {
  private importResolver: {
    resolve: (version: string) => void;
    reject: (version: string) => void;
  } | null = null;

  private callMethodResolvers: {
    id: number;
    resolve: (value: unknown) => void;
    reject: (value: unknown) => void;
  }[] = [];
  private currentCallMethodId = 0;

  constructor(private modulePath: string) {
    worker.on("message", ({ type, payload }) => {
      switch (type) {
        case "import": {
          this.importResolver?.resolve(payload.version);
          break;
        }
        case "callMethod": {
          const resolver = this.callMethodResolvers.find(({ id }) => {
            id === payload.id;
          });
          resolver?.resolve(payload.result);
          break;
        }
        default:
          throw new Error(`Type ${type} isn't supported`);
      }
    });
  }

  async import(): Promise</* version of imported prettier */ string> {
    const promise = new Promise<string>((resolve, reject) => {
      this.importResolver = { resolve, reject };
    });
    worker.postMessage({
      type: "import",
      payload: { modulePath: this.modulePath },
    });
    return promise;
  }

  callMethod(methodName: string, methodArgs: unknown[]): Promise<any> {
    const callMethodId = this.currentCallMethodId++;
    const promise = new Promise((resolve, reject) => {
      this.callMethodResolvers.push({ id: callMethodId, resolve, reject });
    });
    worker.postMessage({
      type: "callMethod",
      payload: {
        id: callMethodId,
        modulePatth: this.modulePath,
        methodName,
        methodArgs,
      },
    });
    return promise;
  }
}
