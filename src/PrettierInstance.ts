import {
  PrettierFileInfoOptions,
  PrettierFileInfoResult,
  PrettierOptions,
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
  getSupportInfo(): Promise<{
    languages: PrettierSupportLanguage[];
  }>;
  clearConfigCache(): Promise<void>;
}

export interface PrettierInstanceConstructor {
  new (modulePath: string): PrettierInstance;
}
