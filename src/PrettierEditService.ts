import * as prettier from "prettier";
import {
  Disposable,
  DocumentFilter,
  DocumentSelector,
  languages,
  Range,
  TextDocument,
  TextEdit,
  workspace
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import { ConfigResolver, RangeFormattingOptions } from "./ConfigResolver";
import { IgnorerResolver } from "./IgnorerResolver";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import { NotificationService } from "./NotificationService";
import { PrettierEditProvider } from "./PrettierEditProvider";
import { StatusBarService } from "./StatusBarService";
import {
  IPrettierStylelint,
  PrettierEslintFormat,
  PrettierTslintFormat
} from "./types";
import { getConfig, getWorkspaceRelativePath } from "./util";

interface ISelectors {
  rangeLanguageSelector: DocumentSelector;
  languageSelector: DocumentSelector;
}

export default class PrettierEditService implements Disposable {
  private formatterHandler: undefined | Disposable;
  private rangeFormatterHandler: undefined | Disposable;

  constructor(
    private moduleResolver: ModuleResolver,
    private languageResolver: LanguageResolver,
    private ignoreResolver: IgnorerResolver,
    private configResolver: ConfigResolver,
    private loggingService: LoggingService,
    private notificationService: NotificationService,
    private statusBarService: StatusBarService
  ) {}

  public registerFormatter = () => {
    this.dispose();
    const { languageSelector, rangeLanguageSelector } = this.selectors(
      this.languageResolver,
      this.loggingService
    );
    const editProvider = new PrettierEditProvider(this.provideEdits);
    this.rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
      rangeLanguageSelector,
      editProvider
    );
    this.formatterHandler = languages.registerDocumentFormattingEditProvider(
      languageSelector,
      editProvider
    );
  };

  public dispose = () => {
    this.moduleResolver.dispose();
    this.notificationService.dispose();
    this.formatterHandler?.dispose();
    this.rangeFormatterHandler?.dispose();
    this.formatterHandler = undefined;
    this.rangeFormatterHandler = undefined;
  };

  /**
   * Build formatter selectors
   */
  private selectors = (
    languageResolver: LanguageResolver,
    loggingService: LoggingService
  ): ISelectors => {
    const { disableLanguages } = getConfig();

    let allLanguages: string[];
    if (workspace.workspaceFolders === undefined) {
      allLanguages = languageResolver.allEnabledLanguages();
    } else {
      allLanguages = [];
      for (const folder of workspace.workspaceFolders) {
        const allWorkspaceLanguages = languageResolver.allEnabledLanguages(
          folder.uri.fsPath
        );
        allLanguages.push(...allWorkspaceLanguages);
      }
    }

    loggingService.logInfo("Enabling prettier for languages", allLanguages);

    const allRangeLanguages = languageResolver.rangeSupportedLanguages();
    loggingService.logInfo(
      "Enabling prettier for range supported languages",
      allRangeLanguages
    );

    const globalLanguageSelector = allLanguages.filter(
      l => !disableLanguages.includes(l)
    );
    const globalRangeLanguageSelector = allRangeLanguages.filter(
      l => !disableLanguages.includes(l)
    );
    if (workspace.workspaceFolders === undefined) {
      // no workspace opened
      return {
        languageSelector: globalLanguageSelector,
        rangeLanguageSelector: globalRangeLanguageSelector
      };
    }

    // at least 1 workspace
    const untitledLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(
      l => ({ language: l, scheme: "untitled" })
    );
    const untitledRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(
      l => ({ language: l, scheme: "untitled" })
    );
    const fileLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(
      l => ({ language: l, scheme: "file" })
    );
    const fileRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(
      l => ({ language: l, scheme: "file" })
    );
    return {
      languageSelector: untitledLanguageSelector.concat(fileLanguageSelector),
      rangeLanguageSelector: untitledRangeLanguageSelector.concat(
        fileRangeLanguageSelector
      )
    };
  };

  private provideEdits = async (
    document: TextDocument,
    options?: RangeFormattingOptions
  ): Promise<TextEdit[]> => {
    const hrStart = process.hrtime();
    const result = await this.format(document.getText(), document, options);
    if (!result) {
      // No edits happened, return never so VS Code can try other formatters
      return [];
    }
    const hrEnd = process.hrtime(hrStart);
    this.loggingService.logInfo(
      `Formatting completed in ${hrEnd[1] / 1000000}ms.`
    );
    return [TextEdit.replace(this.fullDocumentRange(document), result)];
  };

  /**
   * Format the given text with user's configuration.
   * @param text Text to format
   * @param path formatting file's path
   * @returns {string} formatted text
   */
  private async format(
    text: string,
    { fileName, languageId, uri }: TextDocument,
    rangeFormattingOptions?: RangeFormattingOptions
  ): Promise<string | undefined> {
    this.loggingService.logInfo(`Formatting ${fileName}`);

    // LEGACY: Remove in version 4.x
    this.notificationService.warnIfLegacyConfiguration(uri);

    const prettierInstance = this.moduleResolver.getPrettierInstance(
      fileName,
      true /* Show outdated or fallback warnings */
    );

    const vscodeConfig = getConfig(uri);

    // This has to stay, as it allows to skip in sub workspaceFolders. Sadly noop.
    // wf1  (with "lang") -> glob: "wf1/**"
    // wf1/wf2  (without "lang") -> match "wf1/**"
    if (vscodeConfig.disableLanguages.includes(languageId)) {
      return;
    }

    const ignorePath = this.ignoreResolver.getIgnorePath(fileName);

    let fileInfo: prettier.FileInfoResult | undefined;
    if (fileName) {
      fileInfo = await prettierInstance.getFileInfo(fileName, {
        ignorePath,
        resolveConfig: true // Fix for 1.19 (https://prettier.io/blog/2019/11/09/1.19.0.html#api)
      });
      this.loggingService.logInfo("File Info:", fileInfo);
    }

    if (fileInfo && fileInfo.ignored) {
      return;
    }

    let parser: prettier.BuiltInParserName | string | undefined;
    if (fileInfo && fileInfo.inferredParser) {
      parser = fileInfo.inferredParser;
    } else {
      this.loggingService.logWarning(
        "Parser not inferred, using VS Code language."
      );
      const dynamicParsers = this.languageResolver.getParsersFromLanguageId(
        fileName,
        languageId
      );
      if (dynamicParsers.length > 0) {
        parser = dynamicParsers[0];
        this.loggingService.logInfo(`Resolved parser to '${parser}'`);
      }
    }

    if (!parser) {
      this.loggingService.logError(
        `Failed to resolve a parser, skipping file.`
      );
      return;
    }

    const hasConfig = await this.configResolver.checkHasPrettierConfig(
      fileName
    );

    if (!hasConfig && vscodeConfig.requireConfig) {
      return;
    }

    const prettierOptions = await this.configResolver.getPrettierOptions(
      fileName,
      parser as prettier.BuiltInParserName,
      vscodeConfig,
      {
        config: vscodeConfig.configPath
          ? getWorkspaceRelativePath(fileName, vscodeConfig.configPath)
          : undefined,
        editorconfig: true
      },
      rangeFormattingOptions
    );

    this.loggingService.logInfo("Prettier Options:", prettierOptions);

    if (parser === "typescript") {
      const prettierTslintModule = this.moduleResolver.getModuleInstance(
        fileName,
        "prettier-tslint"
      );

      if (prettierTslintModule) {
        return this.safeExecution(() => {
          const prettierTslintFormat = prettierTslintModule.format as PrettierTslintFormat;

          return prettierTslintFormat({
            fallbackPrettierOptions: prettierOptions,
            filePath: fileName,
            text
          });
        }, text);
      }
    }

    if (this.languageResolver.doesLanguageSupportESLint(languageId)) {
      const prettierEslintModule = this.moduleResolver.getModuleInstance(
        fileName,
        "prettier-eslint"
      );
      if (prettierEslintModule) {
        return this.safeExecution(() => {
          const prettierEslintFormat = prettierEslintModule as PrettierEslintFormat;

          return prettierEslintFormat({
            fallbackPrettierOptions: prettierOptions,
            filePath: fileName,
            text
          });
        }, text);
      }
    }

    if (this.languageResolver.doesParserSupportStylelint(parser)) {
      const prettierStylelintModule = this.moduleResolver.getModuleInstance(
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
          text
        );
      }
    }

    return this.safeExecution(
      () => prettierInstance.format(text, prettierOptions),
      text
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
    defaultText: string
  ): string | Promise<string> {
    if (cb instanceof Promise) {
      return cb
        .then(returnValue => {
          this.statusBarService.updateStatusBar(true);

          return returnValue;
        })
        .catch((error: Error) => {
          this.loggingService.logError("Error formatting document.", error);
          this.statusBarService.updateStatusBar(false);

          return defaultText;
        });
    }
    try {
      const returnValue = cb();
      this.statusBarService.updateStatusBar(true);

      return returnValue;
    } catch (error) {
      this.loggingService.logError("Error formatting document.", error);
      this.statusBarService.updateStatusBar(false);

      return defaultText;
    }
  }

  private fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
  }
}
