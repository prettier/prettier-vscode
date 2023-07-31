import { FileInfoOptions, Options, ResolveConfigOptions } from "prettier";
import {
  PrettierInstance,
  PrettierInstanceConstructor,
} from "./PrettierInstance";
import {
  PrettierFileInfoResult,
  PrettierPlugin,
  PrettierSupportLanguage,
} from "./types";
import { PrettierNodeModule } from "./ModuleResolver";
import { loadNodeModule } from "./ModuleLoader";

export const PrettierMainThreadInstance: PrettierInstanceConstructor = class PrettierMainThreadInstance
  implements PrettierInstance
{
  public version: string | null = null;
  private prettierModule: PrettierNodeModule | undefined;

  constructor(private modulePath: string) {}

  public async import(): Promise</* version of imported prettier */ string> {
    this.prettierModule = loadNodeModule(this.modulePath);
    this.version = this.prettierModule?.version ?? null;
    if (this.version == null) {
      throw new Error(`Failed to load Prettier instance: ${this.modulePath}`);
    }
    return this.version;
  }

  public async format(
    source: string,
    options?: Options | undefined
  ): Promise<string> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.format(source, options);
  }

  public async getFileInfo(
    filePath: string,
    fileInfoOptions?: FileInfoOptions | undefined
  ): Promise<PrettierFileInfoResult> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.getFileInfo(filePath, fileInfoOptions);
  }

  public async getSupportInfo({
    plugins,
  }: {
    plugins: (string | PrettierPlugin)[];
  }): Promise<{
    languages: PrettierSupportLanguage[];
  }> {
    if (!this.prettierModule) {
      await this.import();
    }
    // @ts-expect-error actually getSupportInfo can recieve option
    return this.prettierModule!.getSupportInfo({ plugins });
  }

  public async clearConfigCache(): Promise<void> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.clearConfigCache();
  }

  public async resolveConfigFile(
    filePath?: string | undefined
  ): Promise<string | null> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.resolveConfigFile(filePath);
  }

  public async resolveConfig(
    fileName: string,
    options?: ResolveConfigOptions | undefined
  ): Promise<Options | null> {
    if (!this.prettierModule) {
      await this.import();
    }
    return this.prettierModule!.resolveConfig(fileName, options);
  }
};
