import {
    workspace,
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit
} from 'vscode';

const prettier = require('prettier');

interface PrettierConfig {
    printWidth: number,
    tabWidth: number,
    useFlowParser: boolean, // deprecated
    singleQuote: boolean,
    trailingComma: boolean,
    bracketSpacing: boolean,
    jsxBracketSameLine: boolean,
    parser: string
}

function format(text: string): string {
    const config: PrettierConfig = workspace.getConfiguration('prettier') as any;
    /*
    handle deprecated parser option
    */
    let parser = config.parser;
    if (!parser) { // unset config
        parser = config.useFlowParser ? 'flow' : 'babylon';
    }
    let transformed: string;
    try {
        return prettier.format(text, {
            printWidth: config.printWidth,
            tabWidth: config.tabWidth,
            singleQuote: config.singleQuote,
            trailingComma: config.trailingComma,
            bracketSpacing: config.bracketSpacing,
            jsxBracketSameLine: config.jsxBracketSameLine,
            parser: parser
        });
    } catch (e) {
        console.log("Error transforming using prettier:", e.message);
        return text;
    }
}

function fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

class PrettierEditProvider implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider {
    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        return [TextEdit.replace(range, format(document.getText(range)))];
    }
    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        return [TextEdit.replace(fullDocumentRange(document), format(document.getText()))];
    }
}

export default PrettierEditProvider;
export { PrettierConfig }
