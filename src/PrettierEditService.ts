import * as path from "path";
import { pathToFileURL } from "url";
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
import { getParserFromLanguageId } from "./utils/get-parser-from-language.js";
import { LoggingService } from "./LoggingService.js";
import { RESTART_TO_ENABLE } from "./message.js";
import { PrettierEditProvider } from "./PrettierEditProvider.js";
import { FormatterStatus, StatusBar } from "./StatusBar.js";
import {
  ExtensionFormattingOptions,
  ModuleResolverInterface,
  PrettierBuiltInParserName,
  PrettierFileInfoResult,
  PrettierInstance,
  PrettierModule,
  PrettierOptions,
  PrettierPlugin,
  RangeFormattingOptions,
} from "./types.js";
import { getWorkspaceConfig } from "./utils/workspace.js";
import { isAboveV3 } from "./utils/versions.js";
import { findUp, pathExists, FIND_UP_STOP } from "./utils/find-up.js";
import { resolveModuleEntry } from "./utils/resolve-module-entry.js";

/**
 * Resolve and load plugins as module objects.
 * This is necessary because when Prettier is loaded dynamically from the extension,
 * it can't resolve plugin names relative to the project directory.
 * We pre-load the plugins and pass them as objects to Prettier.
 */
async function loadPlugins(
  plugins: (string | PrettierPlugin)[] | undefined,
  fileName: string,
): Promise<PrettierPlugin[]> {
  if (!plugins) {
    return [];
  }

  const dir = path.dirname(fileName);
  const loadedPlugins: PrettierPlugin[] = [];

  for (const plugin of plugins) {
    // If it's already an object, use it directly
    if (typeof plugin !== "string") {
      loadedPlugins.push(plugin);
      continue;
    }

    let pluginPath: string | undefined;

    // If it's already an absolute path, use it directly
    if (path.isAbsolute(plugin)) {
      pluginPath = plugin;
    } else {
      // Try to find the plugin in node_modules starting from the file's directory
      pluginPath = await findUp(
        async (d: string) => {
          const nodeModulesPath = path.join(d, "node_modules", plugin);
          if (await pathExists(nodeModulesPath)) {
            return nodeModulesPath;
          }
          // Stop at marker file
          if (
            await pathExists(path.join(d, ".do-not-use-prettier-vscode-root"))
          ) {
            return FIND_UP_STOP;
          }
          return undefined;
        },
        { cwd: dir },
      );
    }

    if (pluginPath) {
      try {
        // Resolve to actual entry file since ESM doesn't support directory imports
        const entryPath = resolveModuleEntry(pluginPath);
        const moduleUrl = pathToFileURL(entryPath).href;
        const imported = await import(moduleUrl);
        // Handle both ESM and CJS modules
        const pluginModule = imported.default || imported;
        loadedPlugins.push(pluginModule as PrettierPlugin);
      } catch {
        // If we can't load the plugin, skip it - Prettier will report the error
      }
    }
  }

  return loadedPlugins;
}

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
  ".prettierrc.mjs",
  ".prettierrc.ts",
  ".prettierrc.cts",
  ".prettierrc.mts",
  "package.json",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
  "prettier.config.ts",
  "prettier.config.cts",
  "prettier.config.mts",
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
    "jsonc",
    "graphql",
  ];

  constructor(
    private moduleResolver: ModuleResolverInterface,
    private loggingService: LoggingService,
    private statusBar: StatusBar,
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
      `**/{${PRETTIER_CONFIG_FILES.join(",")}}`,
    );
    prettierConfigWatcher.onDidChange(this.prettierConfigChanged);
    prettierConfigWatcher.onDidCreate(this.prettierConfigChanged);
    prettierConfigWatcher.onDidDelete(this.prettierConfigChanged);

    const textEditorChange = window.onDidChangeActiveTextEditor(
      this.handleActiveTextEditorChangedSync,
    );

    this.handleActiveTextEditorChangedSync(window.activeTextEditor);

    return [
      packageWatcher,
      configurationWatcher,
      prettierConfigWatcher,
      textEditorChange,
    ];
  }

  public forceFormatDocument = async () => {
    try {
      const editor = window.activeTextEditor;
      if (!editor) {
        this.loggingService.logInfo(
          "No active document. Nothing was formatted.",
        );
        return;
      }

      this.loggingService.logInfo(
        "Forced formatting will not use ignore files.",
      );

      const edits = await this.provideEdits(editor.document, { force: true });
      if (edits.length !== 1) {
        return;
      }

      await editor.edit((editBuilder) => {
        editBuilder.replace(edits[0].range, edits[0].newText);
      });
    } catch (e) {
      this.loggingService.logError("Error formatting document", e);
    }
  };

  private prettierConfigChanged = async (uri: Uri) => this.resetFormatters(uri);

  private resetFormatters = (uri?: Uri) => {
    if (uri) {
      const workspaceFolder = workspace.getWorkspaceFolder(uri);
      this.registeredWorkspaces.delete(workspaceFolder?.uri.fsPath ?? "global");
    } else {
      // VS Code config change, reset everything
      this.registeredWorkspaces.clear();
    }
    this.statusBar.update(FormatterStatus.Ready);
  };

  private handleActiveTextEditorChangedSync = (
    textEditor: TextEditor | undefined,
  ) => {
    this.handleActiveTextEditorChanged(textEditor).catch((err) => {
      this.loggingService.logError("Error handling text editor change", err);
    });
  };

  private handleActiveTextEditorChanged = async (
    textEditor: TextEditor | undefined,
  ) => {
    if (!textEditor) {
      this.statusBar.hide();
      return;
    }
    const { document } = textEditor;

    if (document.uri.scheme !== "file") {
      // We set as ready for untitled documents,
      // but return because these will always
      // use the global registered formatter.
      this.statusBar.update(FormatterStatus.Ready);
      return;
    }
    const workspaceFolder = workspace.getWorkspaceFolder(document.uri);

    if (!workspaceFolder) {
      // Do nothing, this is only for registering formatters in workspace folder.
      return;
    }

    const prettierInstance = await this.moduleResolver.getPrettierInstance(
      workspaceFolder.uri.fsPath,
    );

    const isRegistered = this.registeredWorkspaces.has(
      workspaceFolder.uri.fsPath,
    );

    // If there isn't an instance here, it is because the module
    // could not be loaded either locally or globally when specified
    if (!prettierInstance) {
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    const selectors = await this.getSelectors(
      prettierInstance,
      document.uri,
      workspaceFolder.uri,
    );

    this.statusBar.updateConfig({
      selector: selectors.languageSelector,
    });

    if (!isRegistered) {
      this.registerDocumentFormatEditorProviders(selectors);
      this.registeredWorkspaces.add(workspaceFolder.uri.fsPath);
      this.loggingService.logDebug(
        `Enabling Prettier for Workspace ${workspaceFolder.uri.fsPath}`,
        selectors,
      );
    }

    const score = languages.match(selectors.languageSelector, document);
    if (score > 0) {
      this.statusBar.update(FormatterStatus.Ready);
    } else {
      this.statusBar.update(FormatterStatus.Disabled);
    }
  };

  public async registerGlobal() {
    const instance = await this.moduleResolver.getGlobalPrettierInstance();
    const selectors = await this.getSelectors(instance);
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
        editProvider,
      );
    this.formatterHandler = languages.registerDocumentFormattingEditProvider(
      languageSelector,
      editProvider,
    );
  }

  /**
   * Build formatter selectors
   */
  private getSelectors = async (
    prettierInstance: PrettierModule | PrettierInstance,
    documentUri?: Uri,
    workspaceFolderUri?: Uri,
  ): Promise<ISelectors> => {
    let loadedPlugins: PrettierPlugin[] = [];

    // Prettier v3 does not load plugins automatically
    // So need to resolve config to get plugins info, then load them as modules.
    if (
      documentUri &&
      "resolveConfig" in prettierInstance &&
      isAboveV3(prettierInstance.version)
    ) {
      const resolvedConfig = await this.moduleResolver.resolveConfig(
        prettierInstance,
        documentUri.fsPath,
        getWorkspaceConfig(documentUri),
      );
      if (resolvedConfig === "error") {
        this.statusBar.update(FormatterStatus.Error);
      } else if (resolvedConfig === "disabled") {
        this.statusBar.update(FormatterStatus.Disabled);
      } else if (resolvedConfig?.plugins) {
        // Load plugins as modules so getSupportInfo can discover their languages
        loadedPlugins = await loadPlugins(
          resolvedConfig.plugins,
          documentUri.fsPath,
        );
      }
    }

    const { languages } = await prettierInstance.getSupportInfo({
      plugins: loadedPlugins,
    });

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

    const { documentSelectors } = getWorkspaceConfig();

    // Language selector for file extensions
    const extensionLanguageSelector: DocumentFilter[] = workspaceFolderUri
      ? this.allExtensions.length === 0
        ? []
        : [
            {
              pattern: `${workspaceFolderUri.fsPath}/**/*.{${this.allExtensions
                .map((e) => e.substring(1))
                .join(",")}}`,
              scheme: "file",
            },
          ]
      : [];

    const customLanguageSelectors: DocumentFilter[] = workspaceFolderUri
      ? documentSelectors.map((pattern) => ({
          pattern: `${workspaceFolderUri.fsPath}/${pattern}`,
          scheme: "file",
        }))
      : [];

    const defaultLanguageSelectors: DocumentFilter[] = [
      ...this.allLanguages.map((language) => ({ language })),
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
      })),
    ];
    return { languageSelector, rangeLanguageSelector };
  };

  private provideEdits = async (
    document: TextDocument,
    options: ExtensionFormattingOptions,
  ): Promise<TextEdit[]> => {
    const startTime = new Date().getTime();
    const result = await this.format(document.getText(), document, options);
    if (!result) {
      // No edits happened, return never so VS Code can try other formatters
      return [];
    }
    const duration = new Date().getTime() - startTime;
    this.loggingService.logInfo(`Formatting completed in ${duration}ms.`);
    const edit = this.minimalEdit(document, result);
    return [edit];
  };

  private minimalEdit(document: TextDocument, string1: string) {
    const string0 = document.getText();
    // length of common prefix
    let i = 0;
    while (
      i < string0.length &&
      i < string1.length &&
      string0[i] === string1[i]
    ) {
      ++i;
    }
    // length of common suffix
    let j = 0;
    while (
      i + j < string0.length &&
      i + j < string1.length &&
      string0[string0.length - j - 1] === string1[string1.length - j - 1]
    ) {
      ++j;
    }
    const newText = string1.substring(i, string1.length - j);
    const pos0 = document.positionAt(i);
    const pos1 = document.positionAt(string0.length - j);

    return TextEdit.replace(new Range(pos0, pos1), newText);
  }

  /**
   * Format the given text with user's configuration.
   * @param text Text to format
   * @param path formatting file's path
   * @returns {string} formatted text
   */
  private async format(
    text: string,
    doc: TextDocument,
    options: ExtensionFormattingOptions,
  ): Promise<string | undefined> {
    const { fileName, uri, languageId } = doc;

    this.loggingService.logInfo(`Formatting ${uri}`);

    const vscodeConfig = getWorkspaceConfig(doc);

    const resolvedConfig = await this.moduleResolver.getResolvedConfig(
      doc,
      vscodeConfig,
    );
    if (resolvedConfig === "error") {
      this.statusBar.update(FormatterStatus.Error);
      return;
    }
    if (resolvedConfig === "disabled") {
      this.statusBar.update(FormatterStatus.Disabled);
      return;
    }

    const prettierInstance =
      await this.moduleResolver.getPrettierInstance(fileName);
    this.loggingService.logInfo("PrettierInstance:", prettierInstance);

    if (!prettierInstance) {
      this.loggingService.logError(
        "Prettier could not be loaded. See previous logs for more information.",
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    let resolvedIgnorePath: string | undefined;
    if (vscodeConfig.ignorePath) {
      resolvedIgnorePath = await this.moduleResolver.getResolvedIgnorePath(
        fileName,
        vscodeConfig.ignorePath,
      );
      if (resolvedIgnorePath) {
        this.loggingService.logInfo(
          `Using ignore file (if present) at ${resolvedIgnorePath}`,
        );
      }
    }

    // Load plugins as module objects so Prettier can use them directly
    // This is necessary because Prettier can't resolve plugin paths from the extension context
    const loadedPlugins = await loadPlugins(resolvedConfig?.plugins, fileName);
    this.loggingService.logInfo(
      "Loaded plugins:",
      loadedPlugins.map((p) =>
        typeof p === "object" && "name" in p ? (p as { name: string }).name : p,
      ),
    );

    let fileInfo: PrettierFileInfoResult | undefined;
    // Only call getFileInfo for actual files (not untitled documents)
    // Untitled documents have uri.scheme === 'untitled' and their fileName
    // is just a display name like 'Untitled-1', not a real path
    if (uri.scheme === "file") {
      // We set resolveConfig: false because we've already resolved the config
      // ourselves with pre-loaded plugins. If we set it to true, Prettier v3
      // would try to resolve the config again and import plugins from its own
      // context, which fails when running from the extension directory.
      fileInfo = await prettierInstance.getFileInfo(fileName, {
        ignorePath: resolvedIgnorePath,
        plugins: loadedPlugins,
        resolveConfig: false,
        withNodeModules: vscodeConfig.withNodeModules,
      });
      this.loggingService.logInfo("File Info:", fileInfo);
    }

    if (!options.force && fileInfo && fileInfo.ignored) {
      this.loggingService.logInfo("File is ignored, skipping.");
      this.statusBar.update(FormatterStatus.Ignore);
      return;
    }

    let parser: PrettierBuiltInParserName | string | undefined;
    if (fileInfo && fileInfo.inferredParser) {
      parser = fileInfo.inferredParser;
    } else if (resolvedConfig && resolvedConfig.parser) {
      // Parser specified in config (e.g., via overrides for custom extensions)
      parser = resolvedConfig.parser as string;
    } else if (languageId !== "plaintext") {
      // Don't attempt VS Code language for plaintext because we never have
      // a formatter for plaintext and most likely the reason for this is
      // somebody has registered a custom file extension without properly
      // configuring the parser in their prettier config.
      this.loggingService.logWarning(
        `Parser not inferred, trying VS Code language.`,
      );
      const { languages } = await prettierInstance.getSupportInfo({
        plugins: loadedPlugins,
      });
      parser = getParserFromLanguageId(languages, uri, languageId);
    }

    if (!parser) {
      this.loggingService.logError(
        `Failed to resolve a parser, skipping file. If you registered a custom file extension, be sure to configure the parser.`,
      );
      this.statusBar.update(FormatterStatus.Error);
      return;
    }

    const prettierOptions = this.getPrettierOptions(
      fileName,
      parser as PrettierBuiltInParserName,
      vscodeConfig,
      resolvedConfig,
      options,
      loadedPlugins,
    );

    this.loggingService.logInfo("Prettier Options:", prettierOptions);

    try {
      const formattedText = await prettierInstance.format(
        text,
        prettierOptions,
      );
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
    parser: PrettierBuiltInParserName,
    vsCodeConfig: PrettierOptions,
    configOptions: PrettierOptions | null,
    extensionFormattingOptions: ExtensionFormattingOptions,
    loadedPlugins: PrettierPlugin[],
  ): Partial<PrettierOptions> {
    const fallbackToVSCodeConfig = configOptions === null;

    const vsOpts: PrettierOptions = {};
    if (fallbackToVSCodeConfig) {
      vsOpts.arrowParens = vsCodeConfig.arrowParens;
      vsOpts.bracketSpacing = vsCodeConfig.bracketSpacing;
      vsOpts.endOfLine = vsCodeConfig.endOfLine;
      vsOpts.htmlWhitespaceSensitivity = vsCodeConfig.htmlWhitespaceSensitivity;
      vsOpts.insertPragma = vsCodeConfig.insertPragma;
      vsOpts.singleAttributePerLine = vsCodeConfig.singleAttributePerLine;
      vsOpts.bracketSameLine = vsCodeConfig.bracketSameLine;
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
      vsOpts.embeddedLanguageFormatting =
        vsCodeConfig.embeddedLanguageFormatting;
      vsOpts.vueIndentScriptAndStyle = vsCodeConfig.vueIndentScriptAndStyle;
      vsOpts.experimentalTernaries = vsCodeConfig.experimentalTernaries;
      vsOpts.objectWrap = vsCodeConfig.objectWrap;
      vsOpts.experimentalOperatorPosition =
        vsCodeConfig.experimentalOperatorPosition;
    }

    this.loggingService.logInfo(
      fallbackToVSCodeConfig
        ? "No local configuration (i.e. .prettierrc or .editorconfig) detected, falling back to VS Code configuration"
        : "Detected local configuration (i.e. .prettierrc or .editorconfig), VS Code configuration will not be used",
    );

    let rangeFormattingOptions: RangeFormattingOptions | undefined;
    if (
      extensionFormattingOptions.rangeEnd &&
      extensionFormattingOptions.rangeStart
    ) {
      rangeFormattingOptions = {
        rangeEnd: extensionFormattingOptions.rangeEnd,
        rangeStart: extensionFormattingOptions.rangeStart,
      };
    }

    const options: PrettierOptions = {
      ...(fallbackToVSCodeConfig ? vsOpts : {}),
      ...{
        /* cspell: disable-next-line */
        filepath: fileName,
        parser: parser as PrettierBuiltInParserName,
      },
      ...(rangeFormattingOptions || {}),
      ...(configOptions || {}),
      // Override plugins with pre-loaded plugin modules so Prettier can use them directly
      // when running from the extension context
      ...(loadedPlugins.length > 0 ? { plugins: loadedPlugins } : {}),
    };

    if (extensionFormattingOptions.force && options.requirePragma === true) {
      options.requirePragma = false;
    }

    return options;
  }
}
