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
    PrettierStylelint,
} from './types.d';

const bundledPrettier = require('prettier') as Prettier;
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
async function format(
    text: string,
    { fileName, languageId }: TextDocument,
    customOptions: object
): Promise<string> {
    const vscodeConfig: PrettierVSCodeConfig = workspace.getConfiguration(
        'prettier'
    ) as any;

    /*
    handle trailingComma changes boolean -> string
    */
    let trailingComma = vscodeConfig.trailingComma;
    if (trailingComma === true) {
        trailingComma = 'es5';
    } else if (trailingComma === false) {
        trailingComma = 'none';
    }
    /*
    handle deprecated parser option
    */
    let parser = vscodeConfig.parser;
    let doesParserSupportEslint = true;
    if (vscodeConfig.typescriptEnable.includes(languageId)) {
        parser = 'typescript';
    }
    if (vscodeConfig.cssEnable.includes(languageId)) {
        parser = 'postcss';
        doesParserSupportEslint = false;
    }
    if (vscodeConfig.jsonEnable.includes(languageId)) {
        parser = 'json';
        doesParserSupportEslint = false;
        trailingComma = 'none'; // Fix will land in prettier > 1.5.2
    }
    if (vscodeConfig.graphqlEnable.includes(languageId)) {
        parser = 'graphql';
        doesParserSupportEslint = false;
    }

    const fileOptions = await bundledPrettier.resolveConfig(fileName);

    const prettierOptions = Object.assign(
        {
            printWidth: vscodeConfig.printWidth,
            tabWidth: vscodeConfig.tabWidth,
            singleQuote: vscodeConfig.singleQuote,
            trailingComma,
            bracketSpacing: vscodeConfig.bracketSpacing,
            jsxBracketSameLine: vscodeConfig.jsxBracketSameLine,
            parser: parser,
            semi: vscodeConfig.semi,
            useTabs: vscodeConfig.useTabs,
        },
        customOptions,
        fileOptions
    );

    if (vscodeConfig.eslintIntegration && doesParserSupportEslint) {
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
    if (vscodeConfig.stylelintIntegration && parser === 'postcss') {
        const prettierStylelint = require('prettier-stylelint') as PrettierStylelint;
        return safeExecution(
            prettierStylelint.format({
                text,
                filePath: fileName,
                prettierOptions
            }),
            text,
            fileName
        );
    }
    const prettier = requireLocalPkg(fileName, 'prettier') as Prettier;
    if (!doesParserSupportEslint && !parserExists(parser, prettier)) {
        return safeExecution(
            () => {
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
    ): Promise<TextEdit[]> {
        return format(document.getText(), document, {
            rangeStart: document.offsetAt(range.start),
            rangeEnd: document.offsetAt(range.end),
        }).then(code => [TextEdit.replace(fullDocumentRange(document), code)]);
    }
    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return format(document.getText(), document, {}).then(code => [
            TextEdit.replace(fullDocumentRange(document), code),
        ]);
    }
}

export default PrettierEditProvider;
