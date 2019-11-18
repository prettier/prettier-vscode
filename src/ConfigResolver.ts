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

    const vsOpts = {
      arrowParens: vsCodeConfig.arrowParens,
      bracketSpacing: vsCodeConfig.bracketSpacing,
      endOfLine: vsCodeConfig.endOfLine,
      htmlWhitespaceSensitivity: vsCodeConfig.htmlWhitespaceSensitivity,
      insertPragma: vsCodeConfig.insertPragma,
      jsxBracketSameLine: vsCodeConfig.jsxBracketSameLine,
      jsxSingleQuote: vsCodeConfig.jsxSingleQuote,
      printWidth: vsCodeConfig.printWidth,
      proseWrap: vsCodeConfig.proseWrap,
      quoteProps: vsCodeConfig.quoteProps,
      requirePragma: vsCodeConfig.requirePragma,
      semi: vsCodeConfig.semi,
      singleQuote: vsCodeConfig.singleQuote,
      tabWidth: vsCodeConfig.tabWidth,
      trailingComma: vsCodeConfig.trailingComma,
      useTabs: vsCodeConfig.useTabs,
      // TODO: Remove once type definition is updated https://github.com/DefinitelyTyped/DefinitelyTyped/pull/40469
      vueIndentScriptAndStyle: (vsCodeConfig as any).vueIndentScriptAndStyle
    };

    const prettierOptions: prettier.Options = {
      ...vsOpts,
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
