import * as prettier from "prettier";

type PrettierModule = typeof prettier;

type TrailingCommaOption = "none" | "es5" | "all";

export type PackageManagers = "npm" | "yarn" | "pnpm";

/**
 * prettier-vscode specific configuration
 */
interface IExtensionConfig {
  /**
   * Use 'prettier-eslint' instead of 'prettier'.
   * Other settings will only be fallbacks in case they could not be inferred from eslint rules.
   */
  eslintIntegration: boolean;
  /**
   * Use 'prettier-tslint' instead of 'prettier'.
   * Other settings will only be fallbacks in case they could not be inferred from tslint rules.
   */
  tslintIntegration: boolean;
  /**
   * Use 'prettier-stylelint' instead of 'prettier'.
   * Other settings will only be fallbacks in case they could not be inferred from eslint rules.
   */
  stylelintIntegration: boolean;
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
   * The package manager to use when resolving global modules.
   */
  packageManager: PackageManagers;
  /**
   * Array of language IDs to ignore
   */
  disableLanguages: string[];
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
}
/**
 * Configuration for prettier-vscode
 */
export type PrettierVSCodeConfig = IExtensionConfig & prettier.Options;

type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

interface IPrettierEslintOptions {
  /**
   * The path of the file being formatted
   * can be used in lieu of `eslintConfig` (eslint will be used to find the
   * relevant config for the file). Will also be used to load the `text` if
   * `text` is not provided.
   */
  filePath?: string;
  /**
   * The text (JavaScript code) to format
   */
  text: string;
  /**
   * The path to the eslint module to use.
   * Will default to require.resolve('eslint')
   */
  eslintPath?: string;
  /**
   * The config to use for formatting
   * with ESLint.
   */
  eslintConfig?: object;
  /**
   * The options to pass for
   * formatting with `prettier`. If not provided, prettier-eslint will attempt
   * to create the options based on the eslintConfig
   */
  prettierOptions?: Partial<prettier.Options>;
  /**
   * The options to pass for
   * formatting with `prettier` if the given option is not inferrable from the
   * eslintConfig.
   */
  fallbackPrettierOptions?: Partial<prettier.Options>;
  /**
   * The level for the logs
   */
  logLevel?: LogLevel;
  /**
   * Run Prettier Last. Default false
   */
  prettierLast?: boolean;
}

/**
 * Format javascript code with prettier-eslint.
 *
 * @param {IPrettierEslintOptions} options - Option bag for prettier-eslint.
 * @returns {string} the formatted code.
 */
export type PrettierEslintFormat = (options: IPrettierEslintOptions) => string;

interface IPrettierTslintOptions {
  /**
   * The path of the file being formatted
   * can be used in lieu of `tslintConfig` (tslint will be used to find the
   * relevant config for the file). Will also be used to load the `text` if
   * `text` is not provided.
   */
  filePath?: string;
  /**
   * The text (TypeScript code) to format
   */
  text: string;
  /**
   * The path to the tslint module to use.
   * Will default to require.resolve('tslint')
   */
  tslintPath?: string;
  /**
   * The config to use for formatting
   * with TSLint.
   */
  tslintConfig?: object;
  /**
   * The options to pass for
   * formatting with `prettier`. If not provided, prettier-tslint will attempt
   * to create the options based on the tslintConfig
   */
  prettierOptions?: Partial<prettier.Options>;
  /**
   * The options to pass for
   * formatting with `prettier` if the given option is not inferrable from the
   * tslintConfig.
   */
  fallbackPrettierOptions?: Partial<prettier.Options>;
  /**
   * The level for the logs
   */
  logLevel?: LogLevel;
  /**
   * Run Prettier Last. Default false
   */
  prettierLast?: boolean;
}

/**
 * Format typescript code with prettier-tslint.
 *
 * @param {IPrettierTslintOptions} options - Option bag for prettier-tslint.
 * @returns {string} the formatted code.
 */
export type PrettierTslintFormat = (options: IPrettierTslintOptions) => string;

export interface IPrettierStylelint {
  format: (options: IPrettierEslintOptions) => Promise<string>;
  resolveConfig: (
    file: string,
    options?: {
      useCache: boolean;
    }
  ) => Promise<[prettier.Options, object]>;
}
