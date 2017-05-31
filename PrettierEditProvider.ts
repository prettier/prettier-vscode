import {
    workspace,
    window,
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit,
    Selection,
    Position
} from 'vscode';

const prettier = require('prettier-with-tabs');

type ParserOption = 'babylon' | 'flow'
type TrailingCommaOption = 'none' | 'es5' | 'all' | boolean /* deprecated boolean*/
type ShowAction = "Show";
interface PrettierConfig {
    printWidth: number,
    tabWidth: number,
    useTabs: boolean,
    singleQuote: boolean,
    trailingComma: TrailingCommaOption,
    bracketSpacing: boolean,
    bracesSpacing: boolean,
    breakProperty: boolean,
    arrowParens: boolean,
    arrayExpand: boolean,
    flattenTernaries: boolean,
    breakBeforeElse: boolean,
    jsxBracketSameLine: boolean,
    groupFirstArg: boolean,
    noSpaceEmptyFn: boolean,
    parser: ParserOption,
    useFlowParser: boolean, // deprecated
}
/**
 * Format the given text with prettier with user's configuration.
 * @param text Text to format
 */
function format(text: string): string {
    const config: PrettierConfig = workspace.getConfiguration('prettier') as any;
    /*
    handle deprecated parser option
    */
    let parser = config.parser;
    if (!parser) { // unset config
        parser = config.useFlowParser ? 'flow' : 'babylon';
    }
    /*
    handle trailingComma changes boolean -> string
    */
    let trailingComma = config.trailingComma;
    if (trailingComma === true) {
        trailingComma = 'es5';
    } else if (trailingComma === false) {
        trailingComma = 'none';
    }
    return prettier.format(text, {
        printWidth: config.printWidth,
        tabWidth: config.tabWidth,
        useTabs: config.useTabs,
        singleQuote: config.singleQuote,
        trailingComma,
        bracketSpacing: config.bracketSpacing,
        bracesSpacing: config.bracesSpacing,
        breakProperty: config.breakProperty,
        arrowParens: config.arrowParens,
        arrayExpand: config.arrayExpand,
        flattenTernaries: config.flattenTernaries,
        breakBeforeElse: config.breakBeforeElse,
        jsxBracketSameLine: config.jsxBracketSameLine,
        groupFirstArg: config.groupFirstArg,
        noSpaceEmptyFn: config.noSpaceEmptyFn,
        parser: parser,
    });
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
        try {
            return [TextEdit.replace(range, format(document.getText(range)))];
        } catch (e) {
            let errorPosition
            if (e.loc) {
                let charPos = e.loc.column;
                if (e.loc.line === 1) { // start selection range
                    charPos = range.start.character + e.loc.column;
                }
                errorPosition = new Position(e.loc.line - 1 + range.start.line, charPos);
            }
            handleError(document, e.message, errorPosition);
        }
    }
    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        try {
            return [TextEdit.replace(fullDocumentRange(document), format(document.getText()))];
        } catch (e) {
            let errorPosition;
            if (e.loc) {
                errorPosition = new Position(e.loc.line - 1, e.loc.column);
            }
            handleError(document, e.message, errorPosition);
        }
    }
}
/**
 * Handle errors for a given text document.
 * Steps: 
 *  - Show the error message.
 *  - Scroll to the error position in given document if asked for it.
 * 
 * @param document Document which raised the error
 * @param message Error message
 * @param errorPosition Position where the error occured. Relative to document.
 */
function handleError(document: TextDocument, message: string, errorPosition: Position) {
    if (errorPosition) {
        window.showErrorMessage(message, "Show").then(function onAction(action?: ShowAction) {
            if (action === "Show") {
                const rangeError = new Range(errorPosition, errorPosition);
                /*
                Show text document which has errored.
                Format on save case. (save all)
                */
                window.showTextDocument(document).then(
                    (editor) => {
                        // move cursor to error position and show it.
                        editor.selection = new Selection(rangeError.start, rangeError.end);
                        editor.revealRange(rangeError);
                    }
                );
            }
        });
    } else {
        window.showErrorMessage(message);
    }
}
export default PrettierEditProvider;
export { PrettierConfig }