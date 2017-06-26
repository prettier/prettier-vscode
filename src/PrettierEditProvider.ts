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

import * as prettier from '../ext';

import { PrettierVSCodeConfig } from './types.d';

type ShowAction = 'Show';

/**
 * Format the given text with user's configuration.
 * @param text Text to format
 * @param path formatting file's path
 * @returns {string} formatted text
 */
function format (
    text: string,
    { fileName, languageId }: TextDocument,
    customOptions: object
): string {
    const config: PrettierVSCodeConfig = workspace.getConfiguration(
        'prettier'
    ) as any;

    let parser = config.parser;
    let isNonJsParser = false;
    if (!parser) {
        parser = 'babylon';
    }
    if (config.typescriptEnable.includes(languageId)) {
        parser = 'typescript';
        isNonJsParser = true;
    }
    if (config.cssEnable.includes(languageId)) {
        parser = 'postcss';
        isNonJsParser = true;
    }

    const prettierOptions = Object.assign(
        {
            printWidth: config.printWidth,
            tabWidth: config.tabWidth,
            useTabs: config.useTabs,
            singleQuote: config.singleQuote,
            jsxSingleQuote: config.jsxSingleQuote,
            trailingComma: config.trailingComma,
            bracketSpacing: config.bracketSpacing,
            bracesSpacing: config.bracesSpacing,
            breakProperty: config.breakProperty,
            arrowParens: config.arrowParens,
            arrayExpand: config.arrayExpand,
            flattenTernaries: config.flattenTernaries,
            breakBeforeElse: config.breakBeforeElse,
            jsxBracketSameLine: config.jsxBracketSameLine,
            noSpaceEmptyFn: config.noSpaceEmptyFn,
            parser: config.parser,
            semi: config.semi,
            spaceBeforeFunctionParen: config.spaceBeforeFunctionParen,
            alignObjectProperties: config.alignObjectProperties,
            filepath: fileName
        },
        customOptions
    );

    return prettier.format(text, prettierOptions);
}

function fullDocumentRange (document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

class PrettierEditProvider implements DocumentFormattingEditProvider {
    provideDocumentFormattingEdits (
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        try {
            return [
                TextEdit.replace(
                    fullDocumentRange(document),
                    format(document.getText(), document, {})
                )
            ];
        } catch (e) {
            let errorPosition;
            if (e.loc) {
                errorPosition = new Position(
                    e.loc.start.line - 1,
                    e.loc.start.column
                );
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
function handleError (
    document: TextDocument,
    message: string,
    errorPosition: Position
) {
    if (errorPosition) {
        window
            .showErrorMessage(message, 'Show')
            .then(function onAction (action?: ShowAction) {
                if (action === 'Show') {
                    const rangeError = new Range(errorPosition, errorPosition);
                    /*
                    Show text document which has errored.
                    Format on save case. (save all)
                    */
                    window.showTextDocument(document).then((editor) => {
                        // move cursor to error position and show it.
                        editor.selection = new Selection(
                            rangeError.start,
                            rangeError.end
                        );
                        editor.revealRange(rangeError);
                    });
                }
            });
    } else {
        window.showErrorMessage(message);
    }
}
export default PrettierEditProvider;
