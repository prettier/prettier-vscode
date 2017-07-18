import { languages, ExtensionContext, workspace } from 'vscode';

import EditProvider from './PrettierEditProvider';

import { ExtensionConfig } from './extension.d';
import { setupStatusHandler } from './exec';

export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();
    const config: ExtensionConfig = workspace.getConfiguration(
        'prettier'
    ) as any;
    const languageSelector = [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
        ...config.cssEnable,
        ...config.jsonEnable,
        ...config.graphqlEnable
    ];

    context.subscriptions.push(
        languages.registerDocumentFormattingEditProvider(
            languageSelector,
            editProvider
        ),
        setupStatusHandler()
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
