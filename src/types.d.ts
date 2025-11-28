import * as prettier from "prettier";
import { TextDocument, Uri } from "vscode";
import { PrettierInstance } from "./PrettierInstance";

// Re-export Prettier types for convenience
type PrettierSupportLanguage = prettier.SupportLanguage;
type PrettierFileInfoResult = prettier.FileInfoResult;
type PrettierBuiltInParserName = prettier.BuiltInParserName;
type PrettierResolveConfigOptions = prettier.ResolveConfigOptions;
type PrettierOptions = prettier.Options;
type PrettierFileInfoOptions = prettier.FileInfoOptions;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrettierPlugin = prettier.Plugin<any> | string | URL;

type PrettierModule = {
  format(source: string, options?: PrettierOptions): Promise<string>;
  getSupportInfo(options?: {
    plugins?: Array<string | PrettierPlugin>;
  }): Promise<{ languages: PrettierSupportLanguage[] }>;
  getFileInfo(
    filePath: string,
    options?: PrettierFileInfoOptions,
  ): Promise<PrettierFileInfoResult>;
};

export type ModuleResolverInterface = {
  getPrettierInstance(
    fileName: string,
  ): Promise<PrettierModule | PrettierInstance | undefined>;
  getResolvedIgnorePath(
    fileName: string,
    ignorePath: string,
  ): Promise<string | undefined>;
  getGlobalPrettierInstance(): PrettierModule;
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
    uri: Uri,
    fileName: string,
    vscodeConfig: PrettierVSCodeConfig,
  ): Promise<"error" | "disabled" | PrettierOptions | null>;
};

export type PackageManagers = "npm" | "yarn" | "pnpm";

/**
 * prettier-vscode specific configuration
 */
interface IExtensionConfig {
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
