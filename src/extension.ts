import { languages, ExtensionContext, DocumentSelector } from 'vscode';
import EditProvider from './PrettierEditProvider';
import { setupErrorHandler } from './errorHandler';
import { getConfig, allEnabledLanguages } from './utils';

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
        setupErrorHandler()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
