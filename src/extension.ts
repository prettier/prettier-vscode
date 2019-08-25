import {
  Disposable,
  DocumentFilter,
  DocumentSelector,
  ExtensionContext,
  languages,
  workspace
  // tslint:disable-next-line: no-implicit-dependencies
} from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import configFileListener from './configCacheHandler';
import { registerDisposables, setupErrorHandler } from './errorHandler';
import ignoreFileHandler from './ignoreFileHandler';
import EditProvider from './PrettierEditProvider';
import {
  allEnabledLanguages,
  getConfig,
  rangeSupportedLanguages
} from './utils';

// the application insights key (also known as instrumentation key)
const telemetryKey = '59a68833-73f0-40b1-8969-e65fb2512e1d';

// telemetry reporter
let reporter: TelemetryReporter;

interface ISelectors {
  rangeLanguageSelector: DocumentSelector;
  languageSelector: DocumentSelector;
}

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
function selectors(): ISelectors {
  let allLanguages: string[];
  if (workspace.workspaceFolders === undefined) {
    allLanguages = allEnabledLanguages();
  } else {
    allLanguages = [];
    for (const folder of workspace.workspaceFolders) {
      allLanguages.push(...allEnabledLanguages(folder.uri.fsPath));
    }
  }

  const allRangeLanguages = rangeSupportedLanguages();
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
    l => ({ language: l, scheme: 'untitled' })
  );
  const untitledRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(
    l => ({ language: l, scheme: 'untitled' })
  );
  const fileLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(
    l => ({ language: l, scheme: 'file' })
  );
  const fileRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(
    l => ({ language: l, scheme: 'file' })
  );
  return {
    languageSelector: untitledLanguageSelector.concat(fileLanguageSelector),
    rangeLanguageSelector: untitledRangeLanguageSelector.concat(
      fileRangeLanguageSelector
    )
  };
}

export function activate(context: ExtensionContext) {
  const extensionPackage = require(context.asAbsolutePath('./package.json'));
  // create telemetry reporter on extension activation
  reporter = new TelemetryReporter(
    'prettier-vscode',
    extensionPackage.version,
    telemetryKey
  );

  const config = getConfig();
  reporter.sendTelemetryEvent('integration_usage', undefined, {
    eslint: config.eslintIntegration ? 1 : 0,
    stylelint: config.stylelintIntegration ? 1 : 0,
    tslint: config.tslintIntegration ? 1 : 0
  });

  context.subscriptions.push(reporter);

  const { fileIsIgnored } = ignoreFileHandler(context.subscriptions);
  const editProvider = new EditProvider(fileIsIgnored);
  function registerFormatter() {
    disposeHandlers();
    const { languageSelector, rangeLanguageSelector } = selectors();
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
  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(registerFormatter),
    {
      dispose: disposeHandlers
    },
    setupErrorHandler(),
    configFileListener(),
    ...registerDisposables()
  );
}

export function deactivate() {
  // This will ensure all pending events get flushed
  reporter.dispose();
}
