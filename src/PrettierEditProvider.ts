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
    Position,
} from 'vscode';

import { requireLocalPkg } from './requirePkg';
import * as semver from 'semver';

import {
    PrettierVSCodeConfig,
    PrettierConfig,
    Prettier,
    PrettierEslintFormat,
    ParserOption,
} from './types.d';

type ShowAction = 'Show';
/**
 * Various parser appearance
 */
const PARSER_SINCE = {
    babylon: '0.0.0',
    flow: '0.0.0',
    typescript: '1.4.0-beta',
    postcss: '1.4.0-beta',
    json: '1.5.0',
    graphql: '1.5.0',
};
/**
 * Check if the given parser exists in a prettier module.
 * @param parser parser to test
 * @param prettier Prettier module to test against
 * @returns {boolean} Does the parser exist
 */
function parserExists(parser: ParserOption, prettier: Prettier) {
    return semver.gte(prettier.version, PARSER_SINCE[parser]);
}
/**
 * Format the given text with user's configuration.
 * @param text Text to format
 * @param path formatting file's path
 * @returns {string} formatted text
 */
function format(
    text: string,
    { fileName, languageId }: TextDocument,
    customOptions: object
): string {
    const config: PrettierVSCodeConfig = workspace.getConfiguration(
        'prettier'
    ) as any;
    /*
    handle trailingComma changes boolean -> string
    */
    let trailingComma = config.trailingComma;
    if (trailingComma === true) {
        trailingComma = 'es5';
    } else if (trailingComma === false) {
        trailingComma = 'none';
    }
    /*
    handle deprecated parser option
    */
    let parser = config.parser;
    let isNonJsParser = false;
    if (!parser) {
        // unset config
        parser = config.useFlowParser ? 'flow' : 'babylon';
    }
    if (config.typescriptEnable.includes(languageId)) {
        parser = 'typescript';
        isNonJsParser = true;
    }
    if (config.cssEnable.includes(languageId)) {
        parser = 'postcss';
        isNonJsParser = true;
    }
    if (config.jsonEnable.includes(languageId)) {
        parser = 'json';
        isNonJsParser = true;
        trailingComma = 'none'; // Fix will land in prettier > 1.5.2
    }
    if (config.graphqlEnable.includes(languageId)) {
        parser = 'graphql';
        isNonJsParser = true;
    }

    const prettierOptions = Object.assign(
        {
            printWidth: config.printWidth,
            tabWidth: config.tabWidth,
            singleQuote: config.singleQuote,
            trailingComma,
            bracketSpacing: config.bracketSpacing,
            jsxBracketSameLine: config.jsxBracketSameLine,
            parser: parser,
            semi: config.semi,
            useTabs: config.useTabs,
        },
        customOptions
    );

    if (config.eslintIntegration && !isNonJsParser) {
        const prettierEslint = require(config.prettierEslint) as PrettierEslintFormat;
        return prettierEslint({
            text,
            filePath: fileName,
            fallbackPrettierOptions: prettierOptions,
        });
    }
    const prettier = requireLocalPkg(fileName, 'prettier') as Prettier;
    if (isNonJsParser && !parserExists(parser, prettier)) {
        const bundledPrettier = require('prettier') as Prettier;
        window.showWarningMessage(
            `prettier@${prettier.version} doesn't support ${languageId}. ` +
                `Falling back to bundled prettier@${bundledPrettier.version}.`
        );
        return bundledPrettier.format(text, prettierOptions);
    }
    return prettier.format(text, prettierOptions);
}

function fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

class PrettierEditProvider
    implements DocumentRangeFormattingEditProvider,
        DocumentFormattingEditProvider {
    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        try {
            return [
                TextEdit.replace(
                    fullDocumentRange(document),
                    format(document.getText(), document, {
                        rangeStart: document.offsetAt(range.start),
                        rangeEnd: document.offsetAt(range.end),
                    })
                ),
            ];
        } catch (e) {
            let errorPosition;
            if (e.loc) {
                let charPos = e.loc.column;
                if (e.loc.line === 1) {
                    // start selection range
                    charPos = range.start.character + e.loc.column;
                }
                errorPosition = new Position(
                    e.loc.line - 1 + range.start.line,
                    charPos
                );
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
            return [
                TextEdit.replace(
                    fullDocumentRange(document),
                    format(document.getText(), document, {})
                ),
            ];
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
function handleError(
    document: TextDocument,
    message: string,
    errorPosition: Position
) {
    if (errorPosition) {
        window
            .showErrorMessage(message, 'Show')
            .then(function onAction(action?: ShowAction) {
                if (action === 'Show') {
                    const rangeError = new Range(errorPosition, errorPosition);
                    /*
                    Show text document which has errored.
                    Format on save case. (save all)
                    */
                    window.showTextDocument(document).then(editor => {
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
