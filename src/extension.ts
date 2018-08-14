import {
    languages,
    ExtensionContext,
    workspace,
    DocumentFilter,
    DocumentSelector,
    Disposable,
} from 'vscode';
import EditProvider from './PrettierEditProvider';
import { setupErrorHandler, registerDisposables } from './errorHandler';
import {
    allEnabledLanguages,
    rangeSupportedLanguages,
    getConfig,
} from './utils';
import configFileListener from './configCacheHandler';
import ignoreFileHandler from './ignoreFileHandler';

interface Selectors {
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
function selectors(): Selectors {
    const allLanguages = allEnabledLanguages();
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
            rangeLanguageSelector: globalRangeLanguageSelector,
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
        ),
    };
}

export function activate(context: ExtensionContext) {
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
            dispose: disposeHandlers,
        },
        setupErrorHandler(),
        configFileListener(),
        ...registerDisposables()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
