import {
    commands,
    languages,
    ExtensionContext,
    DocumentSelector,
    Range,
    Position,
    TextEdit,
    TextDocument,
    window,
    workspace
} from 'vscode';
import EditProvider, { format, PrettierConfig } from './PrettierEditProvider';

const VALID_LANG: DocumentSelector = ['javascript', 'javascriptreact'];

export function activate(context: ExtensionContext) {
    const eventDisposable = (workspace as any).onWillSaveTextDocument(e => {
        const document: TextDocument = e.document;

        if (!document.isDirty) {
            return;
        }

        const config: PrettierConfig = workspace.getConfiguration('prettier') as any;
        const formatOnSave = config.formatOnSave;
        if (!formatOnSave) {
            return;
        }

        e.waitUntil(new Promise(resolve => {
            const prettified = format(document.getText());
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

        let selectionOrRange: Range = editor.selection;
        if (selectionOrRange.isEmpty) {
            selectionOrRange = createFullDocumentRange(document)
        }

        const prettified = format(document.getText(selectionOrRange));

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
    context.subscriptions.push(languages.registerDocumentRangeFormattingEditProvider(VALID_LANG, new EditProvider()));
}

// this method is called when your extension is deactivated
export function deactivate() {
}

const createFullDocumentRange = document => new Range(0, 0, document.lineCount, 0)
