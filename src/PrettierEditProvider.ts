import {
    workspace,
    DocumentRangeFormattingEditProvider,
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
    useFlowParser: boolean,
    singleQuote: boolean,
    trailingComma: boolean,
    bracketSpacing: boolean,
    formatOnSave: boolean
}

function format(text: string): string {
    const config: PrettierConfig = workspace.getConfiguration('prettier') as any;
    let transformed: string;
    try {
        return prettier.format(text, {
            printWidth: config.printWidth,
            tabWidth: config.tabWidth,
            useFlowParser: config.useFlowParser,
            singleQuote: config.singleQuote,
            trailingComma: config.trailingComma,
            bracketSpacing: config.bracketSpacing
        });
    } catch (e) {
        console.log("Error transforming using prettier:", e);
        return text;
    }
}
class PrettierEditProvider implements DocumentRangeFormattingEditProvider {
    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        return [TextEdit.replace(range, format(document.getText(range)))];
    }
}

export default PrettierEditProvider;
export {PrettierConfig}