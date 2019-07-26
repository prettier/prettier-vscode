import {
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit,
} from 'vscode';
import * as prettierTslint from 'prettier-tslint';
import * as prettierEslint from 'prettier-eslint';
import * as prettierStylelint from 'prettier-stylelint';
import { safeExecution, addToOutput, setUsedModule } from './errorHandler';
import { getParsersFromLanguageId, getConfig } from './utils';
import { requireLocalPkg } from './requirePkg';

import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierEslintFormat,
    PrettierTslintFormat,
    ParserOption,
    PrettierStylelint,
    PrettierConfig,
} from './types.d';

import * as _prettier from 'prettier';
const bundledPrettier = _prettier as Prettier;
/**
/**
 * HOLD style parsers (for stylelint integration)
 */
const STYLE_PARSERS: ParserOption[] = ['postcss', 'css', 'less', 'scss'];
/**
 * Check if a given file has an associated prettierconfig.
 * @param filePath file's path
 */
async function hasPrettierConfig(filePath: string) {
    const { config } = await resolveConfig(filePath);
    return config !== null;
}

type ResolveConfigResult = { config: PrettierConfig | null; error?: Error };

/**
 * Resolves the prettierconfig for the given file.
 *
 * @param filePath file's path
 */
async function resolveConfig(
    filePath: string,
    options?: { editorconfig?: boolean }
): Promise<ResolveConfigResult> {
    try {
        const config = await bundledPrettier.resolveConfig(filePath, options);
        return { config };
    } catch (error) {
        return { config: null, error };
    }
}

/**
 * Define which config should be used.
 * If a prettierconfig exists, it returns itself.
 * It merges prettierconfig into vscode's config (editorconfig).
 * Priority:
 * - additionalConfig
 * - prettierConfig
 * - vscodeConfig
 * @param hasPrettierConfig a prettierconfig exists
 * @param additionalConfig config we really want to see in. (range)
 * @param prettierConfig prettier's file config
 * @param vscodeConfig our config
 */
function mergeConfig(
    hasPrettierConfig: boolean,
    additionalConfig: Partial<PrettierConfig>,
    prettierConfig: Partial<PrettierConfig>,
    vscodeConfig: Partial<PrettierConfig>
) {
    return hasPrettierConfig
        ? Object.assign(
              { parser: vscodeConfig.parser }, // always merge our inferred parser in
              prettierConfig,
              additionalConfig
          )
        : Object.assign(vscodeConfig, prettierConfig, additionalConfig);
}
/**
 * Format the given text with user's configuration.
 * @param text Text to format
 * @param path formatting file's path
 * @returns {string} formatted text
 */
async function format(
    text: string,
    { fileName, languageId, uri, isUntitled }: TextDocument,
    customOptions: Partial<PrettierConfig>
): Promise<string> {
    const vscodeConfig: PrettierVSCodeConfig = getConfig(uri);
    const localPrettier = requireLocalPkg(fileName, 'prettier') as Prettier;

    // This has to stay, as it allows to skip in sub workspaceFolders. Sadly noop.
    // wf1  (with "lang") -> glob: "wf1/**"
    // wf1/wf2  (without "lang") -> match "wf1/**"
    if (vscodeConfig.disableLanguages.includes(languageId)) {
        return text;
    }

    const dynamicParsers = getParsersFromLanguageId(
        languageId,
        localPrettier,
        isUntitled ? undefined : fileName
    );
    let useBundled = false;
    let parser: ParserOption;

    if (!dynamicParsers.length) {
        const bundledParsers = getParsersFromLanguageId(
            languageId,
            bundledPrettier,
            isUntitled ? undefined : fileName
        );
        parser = bundledParsers[0] || 'babylon';
        useBundled = true;
    } else if (dynamicParsers.includes(vscodeConfig.parser)) {
        // handle deprecated parser option (parser: "flow")
        parser = vscodeConfig.parser;
    } else {
        parser = dynamicParsers[0];
    }
    const doesParserSupportEslint = [
        'javascript',
        'javascriptreact',
        'typescript',
        'typescriptreact',
        'vue',
    ].includes(languageId);

    const hasConfig = await hasPrettierConfig(fileName);

    if (!hasConfig && vscodeConfig.requireConfig) {
        return text;
    }

    const { config: fileOptions, error } = await resolveConfig(fileName, {
        editorconfig: true,
    });

    if (error) {
        addToOutput(
            `Failed to resolve config for ${fileName}. Falling back to the default config settings.`
        );
    }

    const prettierOptions = mergeConfig(
        hasConfig,
        customOptions,
        fileOptions || {},
        {
            printWidth: vscodeConfig.printWidth,
            tabWidth: vscodeConfig.tabWidth,
            singleQuote: vscodeConfig.singleQuote,
            trailingComma: vscodeConfig.trailingComma,
            bracketSpacing: vscodeConfig.bracketSpacing,
            jsxBracketSameLine: vscodeConfig.jsxBracketSameLine,
            parser: parser,
            semi: vscodeConfig.semi,
            useTabs: vscodeConfig.useTabs,
            proseWrap: vscodeConfig.proseWrap,
            arrowParens: vscodeConfig.arrowParens,
            jsxSingleQuote: vscodeConfig.jsxSingleQuote,
            htmlWhitespaceSensitivity: vscodeConfig.htmlWhitespaceSensitivity,
            endOfLine: vscodeConfig.endOfLine,
            quoteProps: vscodeConfig.quoteProps,
        }
    );

    if (vscodeConfig.tslintIntegration && parser === 'typescript') {
        return safeExecution(
            () => {
                const prettierTslintformat = prettierTslint.format as PrettierTslintFormat;
                setUsedModule('prettier-tslint', 'Unknown', true);

                return prettierTslintformat({
                    text,
                    filePath: fileName,
                    fallbackPrettierOptions: prettierOptions,
                });
            },
            text,
            fileName
        );
    }

    if (vscodeConfig.eslintIntegration && doesParserSupportEslint) {
        return safeExecution(
            () => {
                const prettierEslintFormat = prettierEslint as PrettierEslintFormat;
                setUsedModule('prettier-eslint', 'Unknown', true);

                return prettierEslintFormat({
                    text,
                    filePath: fileName,
                    fallbackPrettierOptions: prettierOptions,
                });
            },
            text,
            fileName
        );
    }

    if (vscodeConfig.stylelintIntegration && STYLE_PARSERS.includes(parser)) {
        const prettierStylelintFormat = prettierStylelint as PrettierStylelint;
        return safeExecution(
            prettierStylelintFormat.format({
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
                    `prettier@${localPrettier.version} doesn't support ${languageId}. ` +
                    `Falling back to bundled prettier@${bundledPrettier.version}.`;

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
    implements
        DocumentRangeFormattingEditProvider,
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

    private _provideEdits(
        document: TextDocument,
        options: Partial<PrettierConfig>
    ) {
        if (!document.isUntitled && this._fileIsIgnored(document.fileName)) {
            return Promise.resolve([]);
        }
        return format(document.getText(), document, options).then(code => [
            TextEdit.replace(fullDocumentRange(document), code),
        ]);
    }
}

export default PrettierEditProvider;
