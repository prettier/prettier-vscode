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

import { safeExecution, addToOutput, setUsedModule } from './errorHandler';
import { onWorkspaceRootChange, getGroup } from './utils';
import { requireLocalPkg } from './requirePkg';

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
    return !!bundledPrettier
        .getSupportInfo(prettier.version)
        .languages.find(lang => lang.parsers.indexOf(parser) > -1);
}

/**
 * Gets a list of parser options from a language ID
 */
function getParsersFromLanguageId(
    languageId: string,
    prettier: Prettier
): ParserOption[] {
    const language = bundledPrettier
        .getSupportInfo(prettier.version)
        .languages.find(
            lang => lang.vscodeLanguageIds.indexOf(languageId) > -1
        );
    if (!language) {
        return [];
    }
    return language.parsers;
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
    const localPrettier = requireLocalPkg(fileName, 'prettier') as Prettier;

    /*
    handle trailingComma changes boolean -> string
    */
    let trailingComma = vscodeConfig.trailingComma;
    if (trailingComma === true) {
        trailingComma = 'es5';
    } else if (trailingComma === false) {
        trailingComma = 'none';
    }

    const dynamicParsers = getParsersFromLanguageId(languageId, localPrettier);
    let parser: ParserOption;

    if (!dynamicParsers.length) {
        return text; // no-op
    } else if (dynamicParsers.indexOf(vscodeConfig.parser) > -1) {
        // handle deprecated parser option (parser: "flow")
        parser = vscodeConfig.parser;
    } else {
        parser = dynamicParsers[0];
    }
    const doesParserSupportEslint = !!getGroup('JavaScript').find(
        lang => lang.parsers.indexOf(parser) > -1
    );

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
                setUsedModule('prettier-eslint', 'Unknown', true);

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
                prettierOptions,
            }),
            text,
            fileName
        );
    }

    if (!doesParserSupportEslint && !parserExists(parser, localPrettier)) {
        return safeExecution(
            () => {
                const warningMessage =
                    `prettier@${localPrettier.version} doesn't support ${
                        languageId
                    }. ` +
                    `Falling back to bundled prettier@${
                        bundledPrettier.version
                    }.`;

                addToOutput(warningMessage);

                if (errorShown === false) {
                    window.showWarningMessage(warningMessage);
                    errorShown = true;
                }

                setUsedModule('prettier', bundledPrettier.version, true);

                return bundledPrettier.format(text, prettierOptions);
            },
            text,
            fileName
        );
    }

    setUsedModule('prettier', localPrettier.version, false);

    return safeExecution(
        () => localPrettier.format(text, prettierOptions),
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
    constructor(private _fileIsIgnored: (filePath: string) => boolean) {}

    provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this._provideEdits(document, {
            rangeStart: document.offsetAt(range.start),
            rangeEnd: document.offsetAt(range.end),
        });
    }

    provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this._provideEdits(document, {});
    }

    private _provideEdits(document: TextDocument, options: object) {
        if (!document.isUntitled && this._fileIsIgnored(document.fileName)) {
            return Promise.resolve([]);
        }
        return format(document.getText(), document, options).then(code => [
            TextEdit.replace(fullDocumentRange(document), code),
        ]);
    }
}

export default PrettierEditProvider;
