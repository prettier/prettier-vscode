import { ResolveConfigOptions } from "prettier";
import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  PrettierOptions,
  PrettierPlugin,
  PrettierSupportLanguage,
  PrettierVSCodeConfig,
} from "./types";
import { LoggingService } from "./LoggingService";

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

export interface PrettierInstanceContext {
  config: PrettierVSCodeConfig;
  loggingService: LoggingService;
}

export interface PrettierInstanceConstructor {
  new (modulePath: string, context: PrettierInstanceContext): PrettierInstance;
}
