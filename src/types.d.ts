export type ParserOption =
  | 'none'
  | 'babel'
  | 'babel-flow'
  | 'flow'
  | 'typescript'
  | 'css'
  | 'scss'
  | 'less'
  | 'json'
  | 'json5'
  | 'json-stringify'
  | 'graphql'
  | 'markdown'
  | 'mdx'
  | 'html'
  | 'vue'
  | 'angular'
  | 'lwc'
  | 'yaml';

type TrailingCommaOption = 'none' | 'es5' | 'all';

interface PrettierSupportInfo {
  languages: {
    name: string;
    since: string;
    parsers: ParserOption[];
    tmScope: string;
    aceMode: string;
    codemirrorMode: string;
    codemirrorMimeType: string;
    extensions: string[];
    linguistLanguageId: number;
    filenames?: string[];
    aliases?: string[];
    group?: string;
    vscodeLanguageIds?: string[]; // Since prettier v1.14.0
  }[];
}

/**
 * Prettier configuration
 */
export interface PrettierConfig {
  printWidth: number;
  tabWidth: number;
  singleQuote: boolean;
  trailingComma: TrailingCommaOption;
  bracketSpacing: boolean;
  jsxBracketSameLine: boolean;
  parser: ParserOption;
  semi: boolean;
  useTabs: boolean;
  proseWrap: 'preserve' | 'always' | 'never';
  arrowParens: 'avoid' | 'always';
  rangeStart: number;
  rangeEnd: number;
  filepath: string;
  jsxSingleQuote: boolean;
  htmlWhitespaceSensitivity: 'css' | 'strict' | 'ignore';
  endOfLine: 'auto' | 'lf' | 'crlf' | 'cr';
  quoteProps: 'as-needed' | 'consistent' | 'preserve';
}

/**
 * Extension specific configuration
 */
interface ExtensionConfig {
  /**
   * Use `prettier-eslint` instead of `prettier`.
   */
  eslintIntegration: boolean;
  /**
   * Use `prettier-tslint` instead of `prettier`.
   */
  tslintIntegration: boolean;
  /**
   * Use `prettier-stylelint` instead of `prettier`.
   */
  stylelintIntegration: boolean;
  /**
   * Path to a `.prettierignore` or similar file such as `.gitignore`.
   */
  ignorePath: string;
  /**
   * Require a config to format code.
   */
  requireConfig: boolean;
  /**
   * List of languages IDs to ignore.
   */
  disableLanguages: string[];
}

export type PrettierVSCodeConfig = ExtensionConfig & PrettierConfig;

export interface Prettier {
  format: (text: string, options?: Partial<PrettierConfig>) => string;
  resolveConfig: (
    filePath: string,
    options?: {
      /**
       * Use cache, defaults to true.
       */
      useCache?: boolean;
      /**
       * Read `.editorconfig`, defaults to false.
       */
      editorconfig?: boolean;
    }
  ) => Promise<PrettierConfig>;
  clearConfigCache: () => void;
  getSupportInfo(version?: string): PrettierSupportInfo;
  readonly version: string;
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface PrettierEslintOptions {
  /**
   * The path of the file being formatted
   * can be used in instead of `eslintConfig` (eslint will be used to find the
   * relevant config for the file). Will also be used to load the `text` if
   * `text` is not provided.
   */
  filePath?: string;
  /**
   * The text (JavaScript code) to format.
   */
  text: string;
  /**
   * The path to the eslint module to use. Will default to `require.resolve('eslint')`
   */
  eslintPath?: string;
  /**
   * The config to use for formatting with ESLint.
   */
  eslintConfig?: object;
  /**
   * The options to pass for formatting with `prettier`.
   * If not provided, prettier-eslint will attempt to create the options based on the `eslintConfig`
   */
  prettierOptions?: Partial<PrettierConfig>;
  /**
   * The options to pass for formatting with `prettier`.
   * If the given option is not inferrable from the `eslintConfig`
   */
  fallbackPrettierOptions?: Partial<PrettierConfig>;
  /**
   * The level for the logs.
   */
  logLevel?: LogLevel;
  /**
   * Run Prettier last, defaults to false.
   */
  prettierLast?: boolean;
}

/**
 * Format JavaScript code with `prettier-eslint`
 * @returns the formatted code.
 */
export type PrettierEslintFormat = (options: PrettierEslintOptions) => string;

interface PrettierTslintOptions {
  /**
   * The path of the file being formatted
   * can be used in instead of `tslintConfig` (tslint will be used to find the
   * relevant config for the file). Will also be used to load the `text` if
   * `text` is not provided.
   */
  filePath?: string;
  /**
   * The text (TypeScript code) to format.
   */
  text: string;
  /**
   * The path to the tslint module to use. Will default to `require.resolve('tslint')`
   */
  tslintPath?: string;
  /**
   * The config to use for formatting with TSLint.
   */
  tslintConfig?: object;
  /**
   * The options to pass for formatting with `prettier`.
   * If not provided, prettier-tslint will attempt to create the options based on the `tslintConfig`
   */
  prettierOptions?: Partial<PrettierConfig>;
  /**
   * The options to pass for formatting with `prettier`.
   * If the given option is not inferrable from the `tslintConfig`
   */
  fallbackPrettierOptions?: Partial<PrettierConfig>;
  /**
   * The level for the logs.
   */
  logLevel?: LogLevel;
  /**
   * Run Prettier last, defaults to false.
   */
  prettierLast?: boolean;
}

/**
 * Format TypeScript code with `prettier-tslint`
 * @returns the formatted code.
 */
export type PrettierTslintFormat = (options: PrettierTslintOptions) => string;

export interface PrettierStylelint {
  format: (options: PrettierEslintOptions) => Promise<string>;
  resolveConfig: (
    file: string,
    options?: {
      useCache: boolean;
    }
  ) => Promise<[PrettierConfig, Object]>;
}
