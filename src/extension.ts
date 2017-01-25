'use strict';

import { commands, ExtensionContext, Range, Position, TextEdit, window, workspace } from 'vscode';
const prettier = require('prettier')

interface PrettierConfig {
    printWidth: number,
    tabWidth: number,
    useFlowParser: boolean,
    singleQuote: boolean,
    trailingComma: boolean,
    bracketSpacing: boolean,
    formatOnSave: boolean
}

interface Rangeable {
    end: Position,
    isEmpty: boolean,
    start: Position
}

export function activate(context: ExtensionContext) {
    const eventDisposable = workspace.onWillSaveTextDocument(e => {
        const document = e.document;

        if (!document.isDirty) {
            return;
        }

        if (document.languageId !== 'javascript') {
            return;
        };

        const config: PrettierConfig = workspace.getConfiguration('prettier') as any;
        const formatOnSave = config.formatOnSave;
        if (!formatOnSave) {
            return;
        }

        e.waitUntil(new Promise(resolve => {
            const prettified = format(document, null);
            const rangeObj = createFullDocumentRange(document)
            const edit = TextEdit.replace(rangeObj, prettified);

            resolve([edit]);
        }))
    });

    const disposable = commands.registerCommand('prettier.format', () => {
        let editor = window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document

        let selectionOrRange : Rangeable = editor.selection;
        if (selectionOrRange.isEmpty) {
            selectionOrRange = createFullDocumentRange(document)
        }

        const prettified = format(document, selectionOrRange);

        editor.edit((editBuilder) => {
            const rangeObj = new Range(
                selectionOrRange.start.line,
                selectionOrRange.start.character,
                selectionOrRange.end.line,
                selectionOrRange.end.character
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

const createFullDocumentRange = document => new Range(0, 0, document.lineCount, 0)

const format = (document, selection = null) => {
    const text = document.getText(selection)
    const config: PrettierConfig = workspace.getConfiguration('prettier') as any;

    try {
        var transformed = prettier.format(text, {
            printWidth: config.printWidth,
            tabWidth: config.tabWidth,
            useFlowParser: config.useFlowParser,
            singleQuote: config.singleQuote,
            trailingComma: config.trailingComma,
            bracketSpacing: config.bracketSpacing
        });
    } catch (e) {
        console.log("Error transforming using prettier:", e);
        transformed = text;
    }

    return transformed
}