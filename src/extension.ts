import {
    languages,
    ExtensionContext,
    DocumentSelector,
    window,
    workspace
} from 'vscode';
import EditProvider from './PrettierEditProvider';
import { PrettierVSCodeConfig } from './types.d';

export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();
    const config: PrettierVSCodeConfig = workspace.getConfiguration(
        'prettier'
    ) as any;
    const languageSelector = [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
        ...config.cssEnable,
    ];

    context.subscriptions.push(
        languages.registerDocumentFormattingEditProvider(languageSelector, editProvider)
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
