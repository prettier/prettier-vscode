import { Disposable, DocumentFilter, DocumentSelector, ExtensionContext, languages, workspace } from 'vscode';
import { configFileListener } from './configCacheHandler';
import { registerDisposables, setupErrorHandler } from './errorHandler';
import { ignoreFileHandler } from './ignoreFileHandler';
import { PrettierEditProvider } from './PrettierEditProvider';
import { allEnabledLanguages, getConfig, supportedLanguages } from './utils';

interface Selectors {
  rangeLanguageSelector: DocumentSelector;
  languageSelector: DocumentSelector;
}

let formatterHandler: undefined | Disposable;
let rangeFormatterHandler: undefined | Disposable;

/**
 * Dispose formatters.
 */
function disposeHandlers() {
  if (formatterHandler) {
    formatterHandler.dispose();
    formatterHandler = undefined;
  }
  if (rangeFormatterHandler) {
    rangeFormatterHandler.dispose();
    rangeFormatterHandler = undefined;
  }
}

/**
 * Build formatter selectors.
 */
function selectors(): Selectors {
  const { disableLanguages } = getConfig();
  const globalLanguageSelector = allEnabledLanguages.filter(lang => !disableLanguages.includes(lang));
  const globalRangeLanguageSelector = supportedLanguages.filter(lang => !disableLanguages.includes(lang));

  // No workspace opened
  if (!workspace.workspaceFolders) {
    return {
      languageSelector: globalLanguageSelector,
      rangeLanguageSelector: globalRangeLanguageSelector
    };
  }

  const untitledLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(lang => ({
    language: lang,
    scheme: 'untitled'
  }));

  const untitledRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(lang => ({
    language: lang,
    scheme: 'untitled'
  }));

  const fileLanguageSelector: DocumentFilter[] = globalLanguageSelector.map(lang => ({
    language: lang,
    scheme: 'file'
  }));

  const fileRangeLanguageSelector: DocumentFilter[] = globalRangeLanguageSelector.map(lang => ({
    language: lang,
    scheme: 'file'
  }));

  return {
    languageSelector: untitledLanguageSelector.concat(fileLanguageSelector),
    rangeLanguageSelector: untitledRangeLanguageSelector.concat(fileRangeLanguageSelector)
  };
}

export function activate(context: ExtensionContext) {
  const { fileIsIgnored } = ignoreFileHandler(context.subscriptions);
  const prettierEditProvider = new PrettierEditProvider(fileIsIgnored);

  const registerFormatter = () => {
    disposeHandlers();

    const { languageSelector, rangeLanguageSelector } = selectors();
    rangeFormatterHandler = languages.registerDocumentRangeFormattingEditProvider(
      rangeLanguageSelector,
      prettierEditProvider
    );
    formatterHandler = languages.registerDocumentFormattingEditProvider(languageSelector, prettierEditProvider);
  };

  registerFormatter();

  context.subscriptions.push(
    workspace.onDidChangeWorkspaceFolders(registerFormatter),
    { dispose: disposeHandlers },
    setupErrorHandler(),
    configFileListener(),
    ...registerDisposables()
  );
}

export function deactivate() {}
