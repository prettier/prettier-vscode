import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { workspace } from "vscode";
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

    const vsOpts: any = {};
    const config = workspace.getConfiguration("prettier");
    const getConfig = (key: string) => {
      const val = config.get(key);
      return val !== null ? val : undefined;
    };

    vsOpts.arrowParens = getConfig("arrowParens");
    vsOpts.bracketSpacing = getConfig("bracketSpacing");
    vsOpts.endOfLine = getConfig("endOfLine");
    vsOpts.htmlWhitespaceSensitivity = getConfig("htmlWhitespaceSensitivity");
    vsOpts.insertPragma = getConfig("insertPragma");
    vsOpts.jsxBracketSameLine = getConfig("jsxBracketSameLine");
    vsOpts.jsxSingleQuote = getConfig("jsxSingleQuote");
    vsOpts.printWidth = getConfig("printWidth");
    vsOpts.proseWrap = getConfig("proseWrap");
    vsOpts.quoteProps = getConfig("quoteProps");
    vsOpts.requirePragma = getConfig("requirePragma");
    vsOpts.semi = getConfig("semi");
    vsOpts.singleQuote = getConfig("singleQuote");
    vsOpts.tabWidth = getConfig("tabWidth");
    vsOpts.trailingComma = getConfig("trailingComma");
    vsOpts.useTabs = getConfig("useTabs");
    vsOpts.vueIndentScriptAndStyle = getConfig("vueIndentScriptAndStyle");

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
