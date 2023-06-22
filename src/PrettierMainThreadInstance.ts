import { FileInfoOptions, Options } from "prettier";
import {
  PrettierInstance,
  PrettierInstanceConstructor,
} from "./PrettierInstance";
import {
  PrettierFileInfoResult,
  PrettierModule,
  PrettierSupportLanguage,
} from "./types";

declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

function nodeModuleLoader() {
  return typeof __webpack_require__ === "function"
    ? __non_webpack_require__
    : require;
}

// Source: https://github.com/microsoft/vscode-eslint/blob/master/server/src/eslintServer.ts
function loadNodeModule<T>(moduleName: string): T | undefined {
  try {
    return nodeModuleLoader()(moduleName);
  } catch (error) {
    throw new Error(`Error loading node module '${moduleName}'`);
  }
}

export const PrettierMainThreadInstance: PrettierInstanceConstructor = class PrettierMainThreadInstance
  implements PrettierInstance
{
  public version: string | null = null;
  private prettierModule: PrettierModule | undefined;

  constructor(private modulePath: string) {}

  public async import(): Promise</* version of imported prettier */ string> {
    this.prettierModule = loadNodeModule(this.modulePath);
    // @ts-expect-error foo
    this.version = this.prettierModule.version;
    if (this.version == null) {
      throw new Error("");
    }
    return this.version;
  }

  public async format(
    source: string,
    options?: Options | undefined
  ): Promise<string> {
    if (this.prettierModule) {
      return this.prettierModule.format(source, options);
    } else {
      throw new Error("");
    }
  }

  public async getFileInfo(
    filePath: string,
    fileInfoOptions?: FileInfoOptions | undefined
  ): Promise<PrettierFileInfoResult> {
    if (this.prettierModule) {
      return this.prettierModule.getFileInfo(filePath, fileInfoOptions);
    } else {
      throw new Error("");
    }
  }

  public async getSupportInfo(): Promise<{
    languages: PrettierSupportLanguage[];
  }> {
    if (this.prettierModule) {
      return this.prettierModule.getSupportInfo();
    } else {
      throw new Error("");
    }
  }

  public async clearConfigCache(): Promise<void> {
    // do nothing
  }
};
