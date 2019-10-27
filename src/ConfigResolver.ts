import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { Uri, workspace } from "vscode";
import { LoggingService } from "./LoggingService";
import { IExtensionConfig } from "./types";

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
    rangeFormattingOptions?: RangeFormattingOptions,
    editorconfig?: boolean
  ): Promise<Partial<prettier.Options>> {
    const { config: configOptions, error } = await this.resolveConfig(
      fileName,
      {
        editorconfig
      }
    );

    if (error) {
      this.loggingService.appendLine(
        `Failed to resolve config for ${fileName}. Falling back to the default config settings.`,
        "ERROR"
      );
    }

    const prettierOptions: prettier.Options = {
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
    options?: { editorconfig?: boolean }
  ): Promise<IResolveConfigResult> {
    try {
      const config = (await prettier.resolveConfig(
        filePath,
        options
      )) as prettier.Options;
      return { config };
    } catch (error) {
      return { config: null, error };
    }
  }
}

export function getConfig(uri?: Uri): IExtensionConfig {
  return workspace.getConfiguration("prettier", uri) as any;
}
