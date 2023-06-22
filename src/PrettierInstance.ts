import { ResolveConfigOptions } from "prettier";
import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  PrettierOptions,
  PrettierPlugin,
  PrettierSupportLanguage,
} from "./types";

export interface PrettierInstance {
  version: string | null;
  import(): Promise<string>;
  format(source: string, options?: PrettierOptions): Promise<string>;
  getFileInfo(
    filePath: string,
    fileInfoOptions?: PrettierFileInfoOptions
  ): Promise<PrettierFileInfoResult>;
  getSupportInfo({
    plugins,
  }: {
    plugins: (string | PrettierPlugin)[];
  }): Promise<{
    languages: PrettierSupportLanguage[];
  }>;
  clearConfigCache(): Promise<void>;
  resolveConfigFile(filePath?: string): Promise<string | null>;
  resolveConfig(
    fileName: string,
    options?: ResolveConfigOptions
  ): Promise<PrettierOptions | null>;
}

export interface PrettierInstanceConstructor {
  new (modulePath: string): PrettierInstance;
}
