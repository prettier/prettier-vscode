import { languages, ExtensionContext, DocumentSelector } from 'vscode';
import EditProvider from './PrettierEditProvider';
import { setupErrorHandler, registerDisposables } from './errorHandler';
import { getConfig, allEnabledLanguages } from './utils';
import configFileListener from './configCacheHandler';
import ignoreFileHandler from './ignoreFileHandler';

export function activate(context: ExtensionContext) {
    const config = getConfig();
    const { fileIsIgnored } = ignoreFileHandler(context.subscriptions);
    const editProvider = new EditProvider(fileIsIgnored);
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
        configFileListener(),
        ...registerDisposables()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
