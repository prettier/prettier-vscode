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
} from 'vscode';

import { safeExecution, addToOutput } from './errorHandler';
import { onWorkspaceRootChange } from './utils';
import { requireLocalPkg } from './requirePkg';
import * as semver from 'semver';

import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierEslintFormat,
    ParserOption,
} from './types.d';

let errorShown: Boolean = false;

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
 * Mark the error as not show, when changing workspaces
 */
onWorkspaceRootChange(() => {
    errorShown = false;
});

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
        return safeExecution(
            () => {
                const prettierEslint = require('prettier-eslint') as PrettierEslintFormat;
                return prettierEslint({
                    text,
                    filePath: fileName,
                    fallbackPrettierOptions: prettierOptions,
                });
            },
            text,
            fileName
        );
    }
    const prettier = requireLocalPkg(fileName, 'prettier') as Prettier;
    if (isNonJsParser && !parserExists(parser, prettier)) {
        return safeExecution(
            () => {
                const bundledPrettier = require('prettier') as Prettier;
                const warningMessage =
                    `prettier@${prettier.version} doesn't support ${languageId}. ` +
                    `Falling back to bundled prettier@${bundledPrettier.version}.`;

                addToOutput(warningMessage);

                if (errorShown === false) {
                    window.showWarningMessage(warningMessage);
                    errorShown = true;
                }

                return bundledPrettier.format(text, prettierOptions);
            },
            text,
            fileName
        );
    }

    return safeExecution(
        () => prettier.format(text, prettierOptions),
        text,
        fileName
    );
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
        return [
            TextEdit.replace(
                fullDocumentRange(document),
                format(document.getText(), document, {
                    rangeStart: document.offsetAt(range.start),
                    rangeEnd: document.offsetAt(range.end),
                })
            ),
        ];
    }
    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): TextEdit[] {
        return [
            TextEdit.replace(
                fullDocumentRange(document),
                format(document.getText(), document, {})
            ),
        ];
    }
}

export default PrettierEditProvider;
