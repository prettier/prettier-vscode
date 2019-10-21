import { clearConfigCache } from "prettier";
import {
  Disposable,
  DocumentFilter,
  DocumentSelector,
  ExtensionContext,
  languages,
  workspace
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import TelemetryReporter from "vscode-extension-telemetry";
import { ConfigResolver, getConfig } from "./ConfigResolver";
import { IgnorerResolver } from "./IgnorerResolver";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import EditProvider from "./PrettierEditProvider";

// the application insights key (also known as instrumentation key)
const telemetryKey = "93c48152-e880-42c1-8652-30ad62ce8b49";

/**
 * Prettier reads configuration from files
 */
const PRETTIER_CONFIG_FILES = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  "package.json",
  "prettier.config.js"
];

interface ISelectors {
  rangeLanguageSelector: DocumentSelector;
  languageSelector: DocumentSelector;
}

// telemetry reporter
let reporter: TelemetryReporter;
let formatterHandler: undefined | Disposable;
let rangeFormatterHandler: undefined | Disposable;

/**
 * Dispose formatters
 */
function disposeHandlers() {
  if (formatterHandler) {
    formatterHandler.dispose();
  }
  if (rangeFormatterHandler) {
    rangeFormatterHandler.dispose();
  }
  formatterHandler = undefined;
  rangeFormatterHandler = undefined;
}
/**
 * Build formatter selectors
 */
function selectors(
  moduleResolver: ModuleResolver,
  loggingService: LoggingService
): ISelectors {
  let allLanguages: string[];
  const bundledPrettierInstance = moduleResolver.getPrettierInstance();
  const bundledLanguageResolver = new LanguageResolver(bundledPrettierInstance);
  if (workspace.workspaceFolders === undefined) {
    allLanguages = bundledLanguageResolver.allEnabledLanguages();
  } else {
    allLanguages = [];
    for (const folder of workspace.workspaceFolders) {
      const prettierInstance = moduleResolver.getPrettierInstance(
        folder.uri.fsPath
      );
      const languageResolver = new LanguageResolver(prettierInstance);
      allLanguages.push(...languageResolver.allEnabledLanguages());
    }
  }

  loggingService.appendLine("Enabling prettier for languages:", "INFO");
  loggingService.appendObject(allLanguages);

  const allRangeLanguages = bundledLanguageResolver.rangeSupportedLanguages();
  loggingService.appendLine(
    "Enabling prettier for range supported languages:",
    "INFO"
  );
  loggingService.appendObject(allRangeLanguages);

  const { disableLanguages } = getConfig();
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
}

export function activate(context: ExtensionContext) {
  // create telemetry reporter on extension activation
  const extensionPackage = require(context.asAbsolutePath("./package.json"));
  reporter = new TelemetryReporter(
    "prettier-vscode",
    extensionPackage.version,
    telemetryKey
  );

  const config = getConfig();
  reporter.sendTelemetryEvent("integration_usage", undefined, {
    eslint: config.eslintIntegration ? 1 : 0,
    stylelint: config.stylelintIntegration ? 1 : 0,
    tslint: config.tslintIntegration ? 1 : 0
  });

  context.subscriptions.push(reporter);

  const loggingService = new LoggingService();
  const moduleResolver = new ModuleResolver(loggingService);
  const ignoreReslver = new IgnorerResolver(loggingService);
  const configResolver = new ConfigResolver(loggingService);

  const editProvider = new EditProvider(
    moduleResolver,
    ignoreReslver,
    configResolver,
    loggingService
  );

  function registerFormatter() {
    disposeHandlers();
    const { languageSelector, rangeLanguageSelector } = selectors(
      moduleResolver,
      loggingService
    );
    rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
      rangeLanguageSelector,
      editProvider
    );
    formatterHandler = languages.registerDocumentFormattingEditProvider(
      languageSelector,
      editProvider
    );
  }
  registerFormatter();

  // Watch for package changes as it could be a prettier plugin which adds more languages
  const packageWatcher = workspace.createFileSystemWatcher("**/package.json");
  packageWatcher.onDidChange(registerFormatter);
  packageWatcher.onDidCreate(registerFormatter);
  packageWatcher.onDidDelete(registerFormatter);

  // Watch for changes to prettier config files
  const fileWatcher = workspace.createFileSystemWatcher(
    `**/{${PRETTIER_CONFIG_FILES.join(",")}}`
  );
  fileWatcher.onDidChange(clearConfigCache);
  fileWatcher.onDidCreate(clearConfigCache);
  fileWatcher.onDidDelete(clearConfigCache);

  // Listen for changes that disable/enable languages
  const configListener = workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("prettier.disableLanguages")) {
      registerFormatter();
    }
  });

  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(registerFormatter),
    configListener,
    fileWatcher,
    packageWatcher,
    {
      dispose: disposeHandlers
    }
  );
}

export function deactivate() {
  // This will ensure all pending events get flushed
  reporter.dispose();
}
