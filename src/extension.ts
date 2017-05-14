import {
    languages,
    ExtensionContext,
    DocumentSelector,
    window,
    workspace,
    commands
} from 'vscode';
import formateditcontent from './PrettierEditProvider';

import { PrettierVSCodeConfig } from './types.d';

const VALID_LANG: DocumentSelector = ['javascript', 'javascriptreact', 'jsx', 'vue'];
const VALIDLANG: Array<string> = ['javascript', 'javascriptreact', 'jsx', 'vue'];

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
    // const editProvider = new EditProvider();
    checkConfig();
    let format = commands.registerTextEditorCommand('prettier.format', editor => {
        let doc = editor.document;
        if (VALIDLANG.indexOf(doc.languageId) === -1) {
            return;
        }
        editor.edit(editBuilder => {
            const result = formateditcontent(doc);
            editBuilder.replace(result.range, result.content);
        })
    })
    context.subscriptions.push(format);
    // context.subscriptions.push(
    //     languages.registerDocumentRangeFormattingEditProvider(VALID_LANG, editProvider)
    // );
    // context.subscriptions.push(
    //     languages.registerDocumentFormattingEditProvider(VALID_LANG, editProvider)
    // );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
