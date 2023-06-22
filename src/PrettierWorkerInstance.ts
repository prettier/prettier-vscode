import { Worker } from "worker_threads";
import * as url from "url";
import * as path from "path";
import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  PrettierOptions,
  PrettierSupportLanguage,
} from "./types";
import {
  PrettierInstance,
  PrettierInstanceConstructor,
} from "./PrettierInstance";

const worker = new Worker(
  url.pathToFileURL(path.join(__dirname, "/worker/prettier-instance-worker.js"))
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

  private currentCallMethodId = 0;

  public version: string | null = null;

  constructor(private modulePath: string) {
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
  }

  public async import(): Promise</* version of imported prettier */ string> {
    const promise = new Promise<string>((resolve, reject) => {
      this.importResolver = { resolve, reject };
    });
    worker.postMessage({
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

  public async getSupportInfo(): Promise<{
    languages: PrettierSupportLanguage[];
  }> {
    const result = await this.callMethod("getSupportInfo", []);
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

  private callMethod(methodName: string, methodArgs: unknown[]): Promise<any> {
    const callMethodId = this.currentCallMethodId++;
    const promise = new Promise((resolve, reject) => {
      this.callMethodResolvers.set(callMethodId, { resolve, reject });
    });
    worker.postMessage({
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
