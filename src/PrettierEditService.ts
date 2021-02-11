import * as prettier from "prettier";
import {
  Disposable,
  DocumentFilter,
  DocumentSelector,
  languages,
  Range,
  TextDocument,
  TextEdit,
  TextEditor,
  Uri,
  window,
  workspace,
  WorkspaceFolder,
} from "vscode";
import { ConfigResolver, RangeFormattingOptions } from "./ConfigResolver";
import { IgnorerResolver } from "./IgnorerResolver";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { INVALID_PRETTIER_CONFIG, RESTART_TO_ENABLE } from "./message";
import { ModuleResolver } from "./ModuleResolver";
import { NotificationService } from "./NotificationService";
import { PrettierEditProvider } from "./PrettierEditProvider";
import { FormatterStatus, StatusBar } from "./StatusBar";
import { PrettierVSCodeConfig } from "./types";
import { getConfig, getWorkspaceRelativePath } from "./util";

interface ISelectors {
  rangeLanguageSelector: DocumentSelector;
  languageSelector: DocumentSelector;
}

/**
 * Prettier reads configuration from files
 */
const PRETTIER_CONFIG_FILES = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.json5",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.toml",
  ".prettierrc.js",
  ".prettierrc.cjs",
  "package.json",
  "prettier.config.js",
  "prettier.config.cjs",
  ".editorconfig",
];

export default class PrettierEditService implements Disposable {
  private formatterHandler: undefined | Disposable;
  private rangeFormatterHandler: undefined | Disposable;
  private registeredWorkspaces = new Set<string>();

  constructor(
    private moduleResolver: ModuleResolver,
    private languageResolver: LanguageResolver,
    private ignoreResolver: IgnorerResolver,
    private configResolver: ConfigResolver,
    private loggingService: LoggingService,
    private notificationService: NotificationService,
    private statusBar: StatusBar
  ) {}

  public registerDisposables(): Disposable[] {
    const packageWatcher = workspace.createFileSystemWatcher("**/package.json");
    packageWatcher.onDidChange(this.resetFormatters);
    packageWatcher.onDidCreate(this.resetFormatters);
    packageWatcher.onDidDelete(this.resetFormatters);

    const configurationWatcher = workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("prettier.enable")) {
        this.loggingService.logWarning(RESTART_TO_ENABLE);
      } else if (event.affectsConfiguration("prettier")) {
        this.resetFormatters();
      }
    });

    const prettierConfigWatcher = workspace.createFileSystemWatcher(
      `**/{${PRETTIER_CONFIG_FILES.join(",")}}`
    );
    prettierConfigWatcher.onDidChange(this.prettierConfigChanged);
    prettierConfigWatcher.onDidCreate(this.prettierConfigChanged);
    prettierConfigWatcher.onDidDelete(this.prettierConfigChanged);

    const textEditorChange = window.onDidChangeActiveTextEditor(
      this.handleActiveTextEditorChanged
    );

    this.handleActiveTextEditorChanged(window.activeTextEditor);

    return [
      packageWatcher,
      configurationWatcher,
      prettierConfigWatcher,
      textEditorChange,
    ];
  }

  private prettierConfigChanged = async (uri: Uri) => this.resetFormatters(uri);

  private resetFormatters = async (uri?: Uri) => {
    if (uri) {
      const workspaceFolder = workspace.getWorkspaceFolder(uri);
      this.registeredWorkspaces.delete(workspaceFolder?.uri.fsPath ?? "global");
    } else {
      // VS Code config change, reset everything
      this.registeredWorkspaces.clear();
    }
    this.statusBar.update(FormatterStatus.Ready);
  };

  private handleActiveTextEditorChanged = async (
    textEditor: TextEditor | undefined
  ) => {
    if (!textEditor) {
      this.statusBar.hide();
      return;
    }
    const { document } = textEditor;
    if (document.uri.scheme !== "file") {
      this.statusBar.hide();
      return;
    }
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri);

    const isRegistered = this.registeredWorkspaces.has(
      workspaceFolder?.uri.fsPath ?? "global"
    );
    if (!isRegistered) {
      this.statusBar.update(FormatterStatus.Loading);
      const { languageSelector, rangeLanguageSelector } = await this.selectors(
        workspaceFolder
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
      this.registeredWorkspaces.add(workspaceFolder?.uri.fsPath ?? "global");
    }

    // No logs here, they are annoying. We are just updating status bar.
    this.loggingService.setOutputLevel("NONE");

    const filePath = document.isUntitled ? undefined : document.fileName;
    const score = languages.match(
      await this.languageResolver.getSupportedLanguages(filePath),
      document
    );
    const disabledLanguages: PrettierVSCodeConfig["disableLanguages"] = getConfig(
      document.uri
    ).disableLanguages;

    if (disabledLanguages.includes(document.languageId)) {
      this.statusBar.update(FormatterStatus.Disabled);
    } else if (score > 0) {
      this.statusBar.update(FormatterStatus.Ready);
    } else {
      this.statusBar.hide();
    }

    this.loggingService.setOutputLevel("INFO"); // Resume logging
  };

  public dispose = () => {
    this.moduleResolver.dispose();
    this.formatterHandler?.dispose();
    this.rangeFormatterHandler?.dispose();
    this.formatterHandler = undefined;
    this.rangeFormatterHandler = undefined;
  };

  /**
   * Build formatter selectors
   */
  private selectors = async (
    workspaceFolder: WorkspaceFolder | undefined
  ): Promise<ISelectors> => {
    let allLanguages: string[];
    if (workspaceFolder) {
      allLanguages = [];
      const allWorkspaceLanguages = await this.languageResolver.getSupportedLanguages(
        workspaceFolder.uri.fsPath
      );
      allWorkspaceLanguages.forEach((lang) => {
        if (!allLanguages.includes(lang)) {
          allLanguages.push(lang);
        }
      });
    } else {
      allLanguages = await this.languageResolver.getSupportedFileExtensions();
    }

    let allExtensions: string[];
    if (workspaceFolder) {
      allExtensions = [];
      const allWorkspaceLanguages = await this.languageResolver.getSupportedFileExtensions(
        workspaceFolder.uri.fsPath
      );
      allWorkspaceLanguages.forEach((lang) => {
        if (!allExtensions.includes(lang)) {
          allExtensions.push(lang);
        }
      });
    } else {
      allExtensions = await this.languageResolver.getSupportedFileExtensions();
    }

    const { disableLanguages, documentSelectors } = getConfig();

    this.loggingService.logInfo(
      `Enabling prettier for languages: ${allLanguages.sort().join(", ")}`
    );

    this.loggingService.logInfo(
      `Enabling prettier for file extensions: ${allExtensions
        .sort()
        .join(", ")}`
    );

    if (documentSelectors && documentSelectors.length > 0) {
      this.loggingService.logInfo(
        `Enabling prettier for user defined selectors: ${documentSelectors
          .sort()
          .join(", ")}`
      );
    }

    const allRangeLanguages = this.languageResolver.getRangeSupportedLanguages();
    this.loggingService.logInfo(
      `Enabling prettier for range supported languages: ${allRangeLanguages
        .sort()
        .join(", ")}`
    );

    // Language selector for file extensions
    const extensionLanguageSelector: DocumentFilter = {
      pattern: `**/*.{${allExtensions.map((e) => e.substring(1)).join(",")}}`,
    };

    const customLanguageSelectors: DocumentFilter[] = [];
    documentSelectors.forEach((pattern) => {
      customLanguageSelectors.push({
        pattern,
      });
    });

    // Language selectors for language IDs
    const globalLanguageSelector: DocumentFilter[] = allLanguages
      .filter((l) => !disableLanguages.includes(l))
      .map((l) => ({ language: l }));
    const globalRangeLanguageSelector: DocumentFilter[] = allRangeLanguages
      .filter((l) => !disableLanguages.includes(l))
      .map((l) => ({ language: l }));

    return {
      languageSelector: globalLanguageSelector
        .concat(customLanguageSelectors)
        .concat(extensionLanguageSelector),
      rangeLanguageSelector: globalRangeLanguageSelector,
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
    { fileName, languageId, uri, isUntitled }: TextDocument,
    rangeFormattingOptions?: RangeFormattingOptions
  ): Promise<string | undefined> {
    this.loggingService.logInfo(`Formatting ${fileName}`);

    const vscodeConfig = getConfig(uri);

    // This has to stay, as it allows to skip in sub workspaceFolders. Sadly noop.
    // wf1  (with "lang") -> glob: "wf1/**"
    // wf1/wf2  (without "lang") -> match "wf1/**"
    if (vscodeConfig.disableLanguages.includes(languageId)) {
      this.statusBar.update(FormatterStatus.Ignore);
      return;
    }

    try {
      const hasConfig = await this.configResolver.checkHasPrettierConfig(
        fileName
      );

      if (!isUntitled && !hasConfig && vscodeConfig.requireConfig) {
        this.loggingService.logInfo(
          "Require config set to true and no config present. Skipping file."
        );
        this.statusBar.update(FormatterStatus.Disabled);
        return;
      }
    } catch (error) {
      this.loggingService.logError(
        "Invalid prettier configuration file detected.",
        error
      );
      this.notificationService.showErrorMessage(INVALID_PRETTIER_CONFIG);
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    const ignorePath = this.ignoreResolver.getIgnorePath(fileName);

    const prettierInstance = await this.moduleResolver.getPrettierInstance(
      fileName,
      {
        showNotifications: true,
      }
    );

    let fileInfo: prettier.FileInfoResult | undefined;
    if (fileName) {
      fileInfo = await prettierInstance.getFileInfo(fileName, {
        ignorePath,
        resolveConfig: true, // Fix for 1.19 (https://prettier.io/blog/2019/11/09/1.19.0.html#api)
        withNodeModules: vscodeConfig.withNodeModules,
      });
      this.loggingService.logInfo("File Info:", fileInfo);
    }

    if (fileInfo && fileInfo.ignored) {
      this.loggingService.logInfo("File is ignored, skipping.");
      this.statusBar.update(FormatterStatus.Ignore);
      return;
    }

    let parser: prettier.BuiltInParserName | string | undefined;
    if (fileInfo && fileInfo.inferredParser) {
      parser = fileInfo.inferredParser;
    } else if (languageId !== "plaintext") {
      // Don't attempt VS Code language for plaintext because we never have
      // a formatter for plaintext and most likely the reason for this is
      // somebody has registered a custom file extension without properly
      // configuring the parser in their prettier config.
      this.loggingService.logWarning(
        `Parser not inferred, trying VS Code language.`
      );
      parser = await this.languageResolver.getParserFromLanguageId(
        uri,
        languageId
      );
    }

    if (!parser) {
      this.loggingService.logError(
        `Failed to resolve a parser, skipping file. If you registered a custom file extension, be sure to configure the parser.`
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    let configPath: string | undefined;
    try {
      configPath = (await prettier.resolveConfigFile(fileName)) ?? undefined;
    } catch (error) {
      this.loggingService.logError(
        `Error resolving prettier configuration for ${fileName}`,
        error
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    const {
      options: prettierOptions,
      error,
    } = await this.configResolver.getPrettierOptions(
      fileName,
      parser as prettier.BuiltInParserName,
      vscodeConfig,
      {
        config: vscodeConfig.configPath
          ? getWorkspaceRelativePath(fileName, vscodeConfig.configPath)
          : configPath,
        editorconfig: vscodeConfig.useEditorConfig,
      },
      rangeFormattingOptions
    );

    if (error) {
      this.loggingService.logError(
        `Error resolving prettier configuration for ${fileName}`,
        error
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    this.loggingService.logInfo("Prettier Options:", prettierOptions);

    try {
      const formattedText = prettierInstance.format(text, prettierOptions);
      this.statusBar.update(FormatterStatus.Success);

      return formattedText;
    } catch (error) {
      this.loggingService.logError("Error formatting document.", error);
      this.statusBar.update(FormatterStatus.Error);

      return text;
    }
  }

  private fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
  }
}
