import * as prettier from "prettier";
import { TextDocument } from "vscode";

// Re-export Prettier types for convenience
export type PrettierSupportLanguage = prettier.SupportLanguage;
export type PrettierFileInfoResult = prettier.FileInfoResult;
export type PrettierBuiltInParserName = prettier.BuiltInParserName;
export type PrettierResolveConfigOptions = prettier.ResolveConfigOptions;
export type PrettierOptions = prettier.Options;
export type PrettierFileInfoOptions = prettier.FileInfoOptions;

export type PrettierPlugin = prettier.Plugin<any> | string | URL;

export interface PrettierInstance {
  version: string | null;
  import(): Promise<string>;
  format(source: string, options?: PrettierOptions): Promise<string>;
  getFileInfo(
    filePath: string,
    fileInfoOptions?: PrettierFileInfoOptions,
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
    options?: prettier.ResolveConfigOptions,
  ): Promise<PrettierOptions | null>;
}

export interface PrettierInstanceConstructor {
  new (modulePath: string): PrettierInstance;
}

export type PrettierModule = {
  version: string;
  format(source: string, options?: PrettierOptions): Promise<string>;
  getSupportInfo(options?: {
    plugins?: Array<string | PrettierPlugin>;
  }): Promise<{ languages: PrettierSupportLanguage[] }>;
  getFileInfo(
    filePath: string,
    options?: PrettierFileInfoOptions,
  ): Promise<PrettierFileInfoResult>;
  resolveConfigFile(filePath?: string): Promise<string | null>;
  resolveConfig(
    fileName: string,
    options?: PrettierResolveConfigOptions,
  ): Promise<PrettierOptions | null>;
  clearConfigCache(): Promise<void>;
};

export type ModuleResolverInterface = {
  getPrettierInstance(
    fileName: string,
  ): Promise<PrettierModule | PrettierInstance | undefined>;
  getResolvedIgnorePath(
    fileName: string,
    ignorePath: string,
  ): Promise<string | undefined>;
  getGlobalPrettierInstance(): Promise<PrettierModule>;
  getResolvedConfig(
    doc: TextDocument,
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null>;
  dispose(): void;
  resolveConfig(
    prettierInstance: {
      resolveConfigFile(filePath?: string): Promise<string | null>;
      resolveConfig(
        fileName: string,
        options?: PrettierResolveConfigOptions,
      ): Promise<PrettierOptions | null>;
    },
    fileName: string,
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null>;
};

export type PackageManagers = "npm" | "yarn" | "pnpm";

/**
 * prettier-vscode specific configuration
 */
export interface IExtensionConfig {
  /**
   * Path to '.prettierignore' or similar.
   */
  ignorePath: string;
  /**
   * Path to prettier module.
   */
  prettierPath: string | undefined;
  /**
   * Path to prettier configuration file.
   */
  configPath: string | undefined;
  /**
   * If true will skip formatting if a prettier config isn't found.
   */
  requireConfig: boolean;
  /**
   * If true, take into account the .editorconfig file when resolving configuration.
   */
  useEditorConfig: boolean;
  /**
   * If true, this extension will attempt to use global npm or yarn modules.
   */
  resolveGlobalModules: boolean;
  /**
   * If true, this extension will process files in node_modules
   */
  withNodeModules: boolean;
  /**
   * Additional file patterns to register for formatting
   */
  documentSelectors: string[];
  /**
   * If true, this extension will be enabled
   */
  enable: boolean;
  /**
   * If true, enabled debug logs
   */
  enableDebugLogs: boolean;
  /**
   * If true, show error notifications for fatal errors
   */
  enableErrorNotifications: boolean;
}
/**
 * Configuration for prettier-vscode
 */
export type PrettierVSCodeConfig = IExtensionConfig & PrettierOptions;

export interface RangeFormattingOptions {
  rangeStart: number;
  rangeEnd: number;
}

export interface ExtensionFormattingOptions {
  rangeStart?: number;
  rangeEnd?: number;
  force: boolean;
}
