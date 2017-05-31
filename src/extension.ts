import {
    languages,
    ExtensionContext,
    DocumentSelector,
    window,
    workspace
} from 'vscode';
import EditProvider, { PrettierConfig } from './PrettierEditProvider';

const VALID_LANG: DocumentSelector = ['javascript', 'javascriptreact'];

function checkConfig() {
    const config: PrettierConfig = workspace.getConfiguration('prettier') as any;
    if (typeof config.trailingComma === 'boolean') {
        window.showWarningMessage("Option 'trailingComma' as a boolean value has been deprecated. Use 'none', 'es5' or 'all' instead.");
    }
}
export function activate(context: ExtensionContext) {
    const editProvider = new EditProvider();
    checkConfig();

    context.subscriptions.push(
        languages.registerDocumentRangeFormattingEditProvider(VALID_LANG, editProvider)
    );
    context.subscriptions.push(
        languages.registerDocumentFormattingEditProvider(VALID_LANG, editProvider)
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
