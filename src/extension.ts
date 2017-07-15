import { languages, ExtensionContext, DocumentSelector } from 'vscode';
import EditProvider from './PrettierEditProvider';
import { setupErrorHandler, registerDisposables } from './errorHandler';
import { getConfig, allEnabledLanguages } from './utils';
import fileListener from './configCacheHandler';

export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();
    const config = getConfig();
    const languageSelector = allEnabledLanguages();

    // CSS/json/graphql doesn't work with range yet.
    const rangeLanguageSelector: DocumentSelector = [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
    ];

    context.subscriptions.push(
        languages.registerDocumentRangeFormattingEditProvider(
            rangeLanguageSelector,
            editProvider
        ),
        languages.registerDocumentFormattingEditProvider(
            languageSelector,
            editProvider
        ),
        setupErrorHandler(),
        fileListener(),
        ...registerDisposables()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
