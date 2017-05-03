import {
    languages,
    ExtensionContext,
    DocumentSelector,
    window,
    workspace
} from 'vscode';
import EditProvider from './PrettierEditProvider';

import { PrettierVSCodeConfig } from './types.d';

const VALID_LANG: DocumentSelector = ['javascript', 'javascriptreact', 'jsx'];

function checkConfig() {
    const config: PrettierVSCodeConfig = workspace.getConfiguration('prettier') as any;
    if (config.useFlowParser) {
        window.showWarningMessage("Option 'useFlowParser' has been deprecated. Use 'parser: \"flow\"' instead.");
    }
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
