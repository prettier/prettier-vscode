import { languages, ExtensionContext } from 'vscode';
import EditProvider from './PrettierEditProvider';
import { setupErrorHandler, registerDisposables } from './errorHandler';
import { allEnabledLanguages, allJSLanguages } from './utils';
import configFileListener from './configCacheHandler';
import ignoreFileHandler from './ignoreFileHandler';

export function activate(context: ExtensionContext) {
    const { fileIsIgnored } = ignoreFileHandler(context.subscriptions);
    const editProvider = new EditProvider(fileIsIgnored);
    const languageSelector = allEnabledLanguages();

    // Range selection is only supported for JS/TS
    const rangeLanguageSelector = allJSLanguages();

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
