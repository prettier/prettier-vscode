'use strict';

import { commands, ExtensionContext, Range, Position, TextEdit, window, workspace } from 'vscode';
const prettier = require('prettier')

console.log('test')

export function activate(context: ExtensionContext) {

    console.log('activate vscode prettier');

    const eventDisposable = (workspace as any).onWillSaveTextDocument(e => {
        const document = e.document;

        if (!document.isDirty) {
            return;
        }

        const config = workspace.getConfiguration('prettier');
        const formatOnSave = (config as any).formatOnSave;
        if (!formatOnSave) {
            return;
        }

        e.waitUntil(new Promise(resolve => {
            const prettified = format(document, null);

            const rangeObj = new Range(0, 0, document.lineCount, 0);
            const edit = TextEdit.replace(rangeObj, prettified);

            resolve([edit]);
        }))
    });

    const disposable = commands.registerCommand('prettier.format', () => {
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        const selection = editor.selection;

        const prettified = format(editor.document, selection);

        editor.edit((editBuilder) => {
            const rangeObj = new Range(
                selection.start.line,
                selection.start.character,
                selection.end.line,
                selection.end.character
            );
            
            editBuilder.replace(rangeObj, prettified);
        })
        
        
    });

    context.subscriptions.push(eventDisposable);
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

const format = (document, selection = null) => {
    const text = document.getText(selection)

    try {
        var transformed = prettier.format(text)
    } catch (e) {
        console.log("Error transforming using prettier:", e);
        transformed = text;
    }

    return transformed
}