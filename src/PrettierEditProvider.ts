import * as prettier from "prettier";
import {
  CancellationToken,
  DocumentFormattingEditProvider,
  DocumentRangeFormattingEditProvider,
  FormattingOptions,
  Range,
  TextDocument,
  TextEdit
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import {
  ConfigResolver,
  getConfig,
  RangeFormattingOptions
} from "./ConfigResolver";
import { IgnorerResolver } from "./IgnorerResolver";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import {
  IPrettierStylelint,
  PrettierEslintFormat,
  PrettierTslintFormat,
  PrettierVSCodeConfig
} from "./types.d";

class PrettierEditProvider
  implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider {
  constructor(
    private moduleResolver: ModuleResolver,
    private ignoreResolver: IgnorerResolver,
    private configResolver: ConfigResolver,
    private loggingService: LoggingService
  ) {}

  public provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this.provideEdits(document, {
      rangeEnd: document.offsetAt(range.end),
      rangeStart: document.offsetAt(range.start)
    });
  }

  public provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this.provideEdits(document);
  }

  private provideEdits(
    document: TextDocument,
    options?: RangeFormattingOptions
  ) {
    return this.format(document.getText(), document, options).then(code => [
      TextEdit.replace(this.fullDocumentRange(document), code)
    ]);
  }

  /**
   * Format the given text with user's configuration.
   * @param text Text to format
   * @param path formatting file's path
   * @returns {string} formatted text
   */
  private async format(
    text: string,
    { fileName, languageId, uri, isUntitled }: TextDocument,
    rangeFormattingOptions?: RangeFormattingOptions
  ): Promise<string> {
    this.loggingService.appendLine(`Formatting ${fileName}.`, "INFO");

    const vscodeConfig: PrettierVSCodeConfig = getConfig(uri);
    const prettierInstance = this.moduleResolver.getPrettierInstance(fileName);
    const languageResolver = new LanguageResolver(prettierInstance);

    // This has to stay, as it allows to skip in sub workspaceFolders. Sadly noop.
    // wf1  (with "lang") -> glob: "wf1/**"
    // wf1/wf2  (without "lang") -> match "wf1/**"
    if (vscodeConfig.disableLanguages.includes(languageId)) {
      return text;
    }

    const ignorePath = this.ignoreResolver.getIgnorePath(fileName);

    let fileInfo: prettier.FileInfoResult | undefined;
    if (fileName) {
      fileInfo = await prettierInstance.getFileInfo(fileName, { ignorePath });
      this.loggingService.appendLine("File Info:", "INFO");
      this.loggingService.appendObject(fileInfo);
    }

    if (fileInfo && fileInfo.ignored) {
      return text;
    }

    let parser: prettier.BuiltInParserName | string | undefined;
    if (fileInfo && fileInfo.inferredParser) {
      parser = fileInfo.inferredParser;
    } else {
      this.loggingService.appendLine(
        "Parser not inferred, using VS Code language.",
        "WARN"
      );
      const dynamicParsers = languageResolver.getParsersFromLanguageId(
        languageId
      );
      this.loggingService.appendObject(dynamicParsers);
      if (dynamicParsers.length > 0) {
        parser = dynamicParsers[0];
        this.loggingService.appendLine(
          `Resolved parser to '${parser}'.`,
          "INFO"
        );
      }
    }

    if (!parser) {
      this.loggingService.appendLine(
        `Failed to resolve a parser, skipping file.`,
        "ERROR"
      );
      return text;
    }

    const hasConfig = await this.configResolver.checkHasPrettierConfig(
      fileName
    );

    if (!hasConfig && vscodeConfig.requireConfig) {
      return text;
    }

    const prettierOptions = await this.configResolver.getPrettierOptions(
      fileName,
      parser as prettier.BuiltInParserName,
      rangeFormattingOptions
    );

    this.loggingService.appendLine("Prettier Options:", "INFO");
    this.loggingService.appendObject(prettierOptions);

    if (vscodeConfig.tslintIntegration && parser === "typescript") {
      const prettierTslintModule = this.moduleResolver.requireLocalPkg(
        fileName,
        "prettier-tslint"
      );

      if (prettierTslintModule) {
        return this.safeExecution(
          () => {
            const prettierTslintFormat = prettierTslintModule.format as PrettierTslintFormat;

            return prettierTslintFormat({
              fallbackPrettierOptions: prettierOptions,
              filePath: fileName,
              text
            });
          },
          text,
          fileName
        );
      }
    }

    if (
      vscodeConfig.eslintIntegration &&
      languageResolver.doesLanguageSupportESLint(languageId)
    ) {
      const prettierEslintModule = this.moduleResolver.requireLocalPkg(
        fileName,
        "prettier-eslint"
      );
      if (prettierEslintModule) {
        return this.safeExecution(
          () => {
            const prettierEslintFormat = prettierEslintModule as PrettierEslintFormat;

            return prettierEslintFormat({
              fallbackPrettierOptions: prettierOptions,
              filePath: fileName,
              text
            });
          },
          text,
          fileName
        );
      }
    }

    if (
      vscodeConfig.stylelintIntegration &&
      languageResolver.doesParserSupportStylelint(parser)
    ) {
      const prettierStylelintModule = this.moduleResolver.requireLocalPkg(
        fileName,
        "prettier-stylelint"
      );
      if (prettierStylelintModule) {
        const prettierStylelint = prettierStylelintModule as IPrettierStylelint;
        return this.safeExecution(
          prettierStylelint.format({
            filePath: fileName,
            prettierOptions,
            text
          }),
          text,
          fileName
        );
      }
    }

    return this.safeExecution(
      () => prettierInstance.format(text, prettierOptions),
      text,
      fileName
    );
  }

  /**
   * Execute a callback safely, if it doesn't work, return default and log messages.
   *
   * @param cb The function to be executed,
   * @param defaultText The default value if execution of the cb failed
   * @param fileName The filename of the current document
   * @returns {string} formatted text or defaultText
   */
  private safeExecution(
    cb: (() => string) | Promise<string>,
    defaultText: string,
    fileName: string
  ): string | Promise<string> {
    if (cb instanceof Promise) {
      return cb
        .then(returnValue => {
          return returnValue;
        })
        .catch((err: Error) => {
          this.loggingService.logError(err, fileName);

          return defaultText;
        });
    }
    try {
      const returnValue = cb();

      return returnValue;
    } catch (err) {
      this.loggingService.logError(err, fileName);

      return defaultText;
    }
  }

  private fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
  }
}

export default PrettierEditProvider;
