import * as prettier from "prettier";
import {
  Disposable,
  DocumentFilter,
  languages,
  Range,
  TextDocument,
  TextEdit,
  TextEditor,
  Uri,
  window,
  workspace,
} from "vscode";
import { getParserFromLanguageId } from "./languageFilters";
import { LoggingService } from "./LoggingService";
import { INVALID_PRETTIER_CONFIG, RESTART_TO_ENABLE } from "./message";
import { ModuleResolver } from "./ModuleResolver";
import { PrettierEditProvider } from "./PrettierEditProvider";
import { FormatterStatus, StatusBar } from "./StatusBar";
import {
  ExtensionFormattingOptions,
  PrettierModule,
  RangeFormattingOptions,
} from "./types";
import { getConfig, getWorkspaceRelativePath } from "./util";

interface ISelectors {
  rangeLanguageSelector: ReadonlyArray<DocumentFilter>;
  languageSelector: ReadonlyArray<DocumentFilter>;
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

  private allLanguages: string[] = [];
  private allExtensions: string[] = [];
  private allRangeLanguages: string[] = [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "json",
    "graphql",
  ];

  constructor(
    private moduleResolver: ModuleResolver,
    private loggingService: LoggingService,
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

  public forceFormatDocument = async () => {
    const editor = window.activeTextEditor;
    if (!editor) {
      this.loggingService.logInfo("No active document. Nothing was formatted.");
      return;
    }

    this.loggingService.logInfo("Forced formatting will not use ignore files.");

    const edits = await this.provideEdits(editor.document, { force: true });
    if (edits.length !== 1) {
      return;
    }

    await editor.edit((editBuilder) => {
      editBuilder.replace(edits[0].range, edits[0].newText);
    });
  };

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

    if (document.uri.scheme === "untitled") {
      // We set as ready for untitled documents,
      // but return because these will always
      // use the global registered formatter.
      this.statusBar.update(FormatterStatus.Ready);
      return;
    } else if (document.uri.scheme !== "file") {
      this.statusBar.hide();
      return;
    }
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri);

    if (!workspaceFolder) {
      // Do nothing, this is only for registering formatters in workspace folder.
      return;
    }

    const prettierInstance = await this.moduleResolver.getPrettierInstance(
      workspaceFolder?.uri.fsPath
    );

    const isRegistered = this.registeredWorkspaces.has(
      workspaceFolder.uri.fsPath
    );

    // Already registered and no instances means that the user
    // already blocked the execution so we don't do anything
    if (isRegistered && !prettierInstance) {
      return;
    }

    // If there isn't an instance here, it is the first time trying to load
    // prettier and the user denied. Log the deny and mark as registered.
    if (!prettierInstance) {
      this.loggingService.logError(
        "The Prettier extension is blocked from execution in this project."
      );
      this.statusBar.update(FormatterStatus.Disabled);
      this.registeredWorkspaces.add(workspaceFolder.uri.fsPath);
      return;
    }

    const selectors = await this.getSelectors(
      prettierInstance,
      workspaceFolder.uri
    );

    if (!isRegistered) {
      this.registerDocumentFormatEditorProviders(selectors);
      this.registeredWorkspaces.add(workspaceFolder.uri.fsPath);
      this.loggingService.logDebug(
        `Enabling Prettier for Workspace ${workspaceFolder.uri.fsPath}`,
        selectors
      );
    }

    const score = languages.match(selectors.languageSelector, document);
    const isFormatterEnabled = true;
    if (!isFormatterEnabled) {
      this.statusBar.update(FormatterStatus.Disabled);
    } else if (score > 0) {
      this.statusBar.update(FormatterStatus.Ready);
    } else {
      this.statusBar.hide();
    }
  };

  public async registerGlobal() {
    const selectors = await this.getSelectors(prettier);
    this.registerDocumentFormatEditorProviders(selectors);
    this.loggingService.logDebug("Enabling Prettier globally", selectors);
  }

  public dispose = () => {
    this.moduleResolver.dispose();
    this.formatterHandler?.dispose();
    this.rangeFormatterHandler?.dispose();
    this.formatterHandler = undefined;
    this.rangeFormatterHandler = undefined;
  };

  private registerDocumentFormatEditorProviders({
    languageSelector,
    rangeLanguageSelector,
  }: ISelectors) {
    this.dispose();
    const editProvider = new PrettierEditProvider(this.provideEdits);
    this.rangeFormatterHandler =
      languages.registerDocumentRangeFormattingEditProvider(
        rangeLanguageSelector,
        editProvider
      );
    this.formatterHandler = languages.registerDocumentFormattingEditProvider(
      languageSelector,
      editProvider
    );
  }

  /**
   * Build formatter selectors
   */
  private getSelectors = async (
    prettierInstance: PrettierModule,
    uri?: Uri
  ): Promise<ISelectors> => {
    const { languages } = prettierInstance.getSupportInfo();

    languages.forEach((lang) => {
      if (lang && lang.vscodeLanguageIds) {
        this.allLanguages.push(...lang.vscodeLanguageIds);
      }
    });
    this.allLanguages = this.allLanguages.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    languages.forEach((lang) => {
      if (lang && lang.extensions) {
        this.allExtensions.push(...lang.extensions);
      }
    });
    this.allExtensions = this.allExtensions.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });

    const { documentSelectors } = getConfig();

    // Language selector for file extensions
    const extensionLanguageSelector: DocumentFilter[] = uri
      ? this.allExtensions.length === 0
        ? []
        : [
            {
              pattern: `${uri.fsPath}/**/*.{${this.allExtensions
                .map((e) => e.substring(1))
                .join(",")}}`,
              scheme: "file",
            },
          ]
      : [];

    const customLanguageSelectors: DocumentFilter[] = uri
      ? documentSelectors.map((pattern) => ({
          pattern: `${uri.fsPath}/${pattern}`,
          scheme: "file",
        }))
      : [];

    const defaultLanguageSelectors: DocumentFilter[] = [
      ...this.allLanguages.map((language) => ({ language, scheme: "file" })),
      ...this.allLanguages.map((language) => ({
        language,
        scheme: "untitled",
      })),
      { language: "jsonc", scheme: "vscode-userdata" }, // Selector for VSCode settings.json
    ];

    const languageSelector = [
      ...customLanguageSelectors,
      ...extensionLanguageSelector,
      ...defaultLanguageSelectors,
    ];

    const rangeLanguageSelector: DocumentFilter[] = [
      ...this.allRangeLanguages.map((language) => ({
        language,
        scheme: "file",
      })),
      ...this.allRangeLanguages.map((language) => ({
        language,
        scheme: "untitled",
      })),
    ];

    return { languageSelector, rangeLanguageSelector };
  };

  private provideEdits = async (
    document: TextDocument,
    options: ExtensionFormattingOptions
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
    options: ExtensionFormattingOptions
  ): Promise<string | undefined> {
    this.loggingService.logInfo(`Formatting ${fileName}`);

    const vscodeConfig = getConfig(uri);

    let configPath: string | undefined;
    try {
      if (!isUntitled) {
        configPath = (await prettier.resolveConfigFile(fileName)) ?? undefined;
      }
    } catch (error) {
      this.loggingService.logError(
        `Error resolving prettier configuration for ${fileName}`,
        error
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    const resolveConfigOptions: prettier.ResolveConfigOptions = {
      config: isUntitled
        ? undefined
        : vscodeConfig.configPath
        ? getWorkspaceRelativePath(fileName, vscodeConfig.configPath)
        : configPath,
      editorconfig: isUntitled ? undefined : vscodeConfig.useEditorConfig,
    };

    let resolvedConfig: prettier.Options | null;
    try {
      resolvedConfig = isUntitled
        ? null
        : await prettier.resolveConfig(fileName, resolveConfigOptions);
    } catch (error) {
      this.loggingService.logError(
        "Invalid prettier configuration file detected.",
        error
      );
      this.loggingService.logError(INVALID_PRETTIER_CONFIG);
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    if (!isUntitled && !resolvedConfig && vscodeConfig.requireConfig) {
      this.loggingService.logInfo(
        "Require config set to true and no config present. Skipping file."
      );
      this.statusBar.update(FormatterStatus.Disabled);
      return;
    }

    if (resolveConfigOptions.config) {
      this.loggingService.logInfo(
        `Using config file at '${resolveConfigOptions.config}'`
      );
    }

    let resolvedIgnorePath: string | undefined;
    if (vscodeConfig.ignorePath) {
      resolvedIgnorePath = getWorkspaceRelativePath(
        fileName,
        vscodeConfig.ignorePath
      );
      if (resolvedIgnorePath) {
        this.loggingService.logInfo(
          `Using ignore file (if present) at ${resolvedIgnorePath}`
        );
      }
    }

    const prettierInstance = await this.moduleResolver.getPrettierInstance(
      fileName
    );

    if (!prettierInstance) {
      this.loggingService.logError(
        "Prettier could not be loaded. See previous logs for more information."
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    let fileInfo: prettier.FileInfoResult | undefined;
    if (fileName) {
      fileInfo = await prettierInstance.getFileInfo(fileName, {
        ignorePath: resolvedIgnorePath,
        resolveConfig: true,
        withNodeModules: vscodeConfig.withNodeModules,
      });
      this.loggingService.logInfo("File Info:", fileInfo);
    }

    if (!options.force && fileInfo && fileInfo.ignored) {
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
      const languages = prettierInstance.getSupportInfo().languages;
      parser = getParserFromLanguageId(languages, uri, languageId);
    }

    if (!parser) {
      this.loggingService.logError(
        `Failed to resolve a parser, skipping file. If you registered a custom file extension, be sure to configure the parser.`
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    let rangeFormattingOptions: RangeFormattingOptions | undefined;
    if (options.rangeEnd && options.rangeStart) {
      rangeFormattingOptions = {
        rangeEnd: options.rangeEnd,
        rangeStart: options.rangeStart,
      };
    }

    const prettierOptions = this.getPrettierOptions(
      fileName,
      parser as prettier.BuiltInParserName,
      vscodeConfig,
      resolvedConfig,
      rangeFormattingOptions
    );

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

  private getPrettierOptions(
    fileName: string,
    parser: prettier.BuiltInParserName,
    vsCodeConfig: prettier.Options,
    configOptions: prettier.Options | null,
    rangeFormattingOptions?: RangeFormattingOptions
  ): Partial<prettier.Options> {
    const fallbackToVSCodeConfig = configOptions === null;

    const vsOpts: prettier.Options = {};
    if (fallbackToVSCodeConfig) {
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
      vsOpts.vueIndentScriptAndStyle = vsCodeConfig.vueIndentScriptAndStyle;
    }

    this.loggingService.logInfo(
      fallbackToVSCodeConfig
        ? "No local configuration (i.e. .prettierrc or .editorconfig) detected, falling back to VS Code configuration"
        : "Detected local configuration (i.e. .prettierrc or .editorconfig), VS Code configuration will not be used"
    );

    const options: prettier.Options = {
      ...(fallbackToVSCodeConfig ? vsOpts : {}),
      ...{
        /* cspell: disable-next-line */
        filepath: fileName,
        parser: parser as prettier.BuiltInParserName,
      },
      ...(rangeFormattingOptions || {}),
      ...(configOptions || {}),
    };

    return options;
  }

  private fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
  }
}
