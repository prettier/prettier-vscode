import {
    languages,
    ExtensionContext,
    DocumentSelector,
    window,
    workspace
} from 'vscode';
import EditProvider, { PrettierConfig } from './PrettierEditProvider';

const VALID_LANG: DocumentSelector = ['javascript', 'javascriptreact'];

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        languages.registerDocumentRangeFormattingEditProvider(VALID_LANG, new EditProvider())
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
