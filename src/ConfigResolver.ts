import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { LoggingService } from "./LoggingService";

interface IResolveConfigResult {
  config: prettier.Options | null;
  error?: Error;
}

export interface RangeFormattingOptions {
  rangeStart: number;
  rangeEnd: number;
}

export class ConfigResolver {
  constructor(private loggingService: LoggingService) {}

  public async getPrettierOptions(
    fileName: string,
    parser: prettier.BuiltInParserName,
    vsCodeConfig: prettier.Options,
    options: prettier.ResolveConfigOptions,
    rangeFormattingOptions?: RangeFormattingOptions
  ): Promise<Partial<prettier.Options>> {
    const { config: configOptions, error } = await this.resolveConfig(
      fileName,
      options
    );

    if (error) {
      this.loggingService.logMessage(
        `Failed to resolve config for ${fileName}. Falling back to the default config settings.`,
        "ERROR"
      );
    }

    // TODO: Set type once type definition is updated https://github.com/DefinitelyTyped/DefinitelyTyped/pull/40469
    const vsOpts: any = {};

    if (configOptions === null) {
      vsOpts.arrowParens = vsCodeConfig.arrowParens;
      vsOpts.bracketSpacing = vsCodeConfig.bracketSpacing;
      vsOpts.endOfLine = vsCodeConfig.endOfLine;
      vsOpts.htmlWhitespaceSensitivity = vsCodeConfig.htmlWhitespaceSensitivity;
      vsOpts.insertPragma = vsCodeConfig.insertPragma;
      vsOpts.jsxBracketSameLine = vsCodeConfig.jsxBracketSameLine;
      vsOpts.jsxSingleQuote = vsCodeConfig.jsxSingleQuote;
      vsOpts.printWidth = vsCodeConfig.printWidth;
      vsOpts.proseWrap = vsCodeConfig.proseWrap;
      vsOpts.quoteProps = vsCodeConfig.quoteProps;
      vsOpts.requirePragma = vsCodeConfig.requirePragma;
      vsOpts.semi = vsCodeConfig.semi;
      vsOpts.singleQuote = vsCodeConfig.singleQuote;
      vsOpts.tabWidth = vsCodeConfig.tabWidth;
      vsOpts.trailingComma = vsCodeConfig.trailingComma;
      vsOpts.useTabs = vsCodeConfig.useTabs;
      // TODO: Remove once type definition is updated https://github.com/DefinitelyTyped/DefinitelyTyped/pull/40469
      vsOpts.vueIndentScriptAndStyle = (vsCodeConfig as any).vueIndentScriptAndStyle;

      this.loggingService.logMessage(
        "No local configuration detected, using VS Code configuration.",
        "INFO"
      );
    }

    const prettierOptions: prettier.Options = {
      ...(configOptions === null ? vsOpts : {}),
      ...{
        filepath: fileName,
        parser: parser as prettier.BuiltInParserName
      },
      ...(rangeFormattingOptions || {}),
      ...(configOptions || {})
    };

    return prettierOptions;
  }

  /**
   * Check if a given file has an associated prettierconfig.
   * @param filePath file's path
   */
  public async checkHasPrettierConfig(filePath: string) {
    const { config } = await this.resolveConfig(filePath);
    return config !== null;
  }

  /**
   * Resolves the prettierconfig for the given file.
   *
   * @param filePath file's path
   */
  private async resolveConfig(
    filePath: string,
    options?: prettier.ResolveConfigOptions
  ): Promise<IResolveConfigResult> {
    try {
      const config = await prettier.resolveConfig(filePath, options);
      return { config };
    } catch (error) {
      return { config: null, error };
    }
  }
}
