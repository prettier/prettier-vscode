import {
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit,
} from 'vscode';

import { safeExecution, addToOutput, setUsedModule } from './errorHandler';
import { getGroup, getParsersFromLanguageId, getConfig } from './utils';
import { requireLocalPkg } from './requirePkg';

import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierEslintFormat,
    ParserOption,
    PrettierStylelint,
    PrettierConfig,
} from './types.d';

const bundledPrettier = require('prettier') as Prettier;

/**
 * Format the given text with user's configuration.
 * @param text Text to format
 * @param path formatting file's path
 * @returns {string} formatted text
 */
async function format(
    text: string,
    { fileName, languageId, uri }: TextDocument,
    customOptions: object
): Promise<string> {
    const vscodeConfig: PrettierVSCodeConfig = getConfig(uri);
    const localPrettier = requireLocalPkg(fileName, 'prettier') as Prettier;

    if (vscodeConfig.disableLanguages.includes(languageId)) {
        return text;
    }

    /*
    handle trailingComma changes boolean -> string
    */
    let trailingComma = vscodeConfig.trailingComma;
    if (trailingComma === true) {
        trailingComma = 'es5';
    } else if (trailingComma === false) {
        trailingComma = 'none';
    }

    const dynamicParsers = getParsersFromLanguageId(languageId, localPrettier.version);
    let useBundled = false;
    let parser: ParserOption;

    if (!dynamicParsers.length) {
        const bundledParsers = getParsersFromLanguageId(
            languageId,
            bundledPrettier.version
        );
        parser = bundledParsers[0] || 'babylon';
        useBundled = true;
    } else if (dynamicParsers.includes(vscodeConfig.parser)) {
        // handle deprecated parser option (parser: "flow")
        parser = vscodeConfig.parser;
    } else {
        parser = dynamicParsers[0];
    }
    const doesParserSupportEslint = getGroup('JavaScript').some(lang =>
        lang.parsers.includes(parser)
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
            proseWrap: vscodeConfig.proseWrap,
        } as PrettierConfig,
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

    if (!doesParserSupportEslint && useBundled) {
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
