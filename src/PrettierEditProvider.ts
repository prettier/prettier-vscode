import * as bundledPrettier from 'prettier';
import {
    CancellationToken,
    DocumentFormattingEditProvider,
    DocumentRangeFormattingEditProvider,
    FormattingOptions,
    Range,
    TextDocument,
    TextEdit
} from 'vscode';
import { addToOutput, safeExecution, setUsedModule } from './errorHandler';
import { requireLocalPkg } from './requirePkg';
import {
    PrettierEslintFormat,
    PrettierStylelint,
    PrettierTslintFormat,
    PrettierVSCodeConfig
} from './types.d';
import { getConfig, getParsersFromLanguageId } from './utils';

/**
 * HOLD style parsers (for stylelint integration)
 */
const STYLE_PARSERS: string[] = ['postcss', 'css', 'less', 'scss'];
/**
 * Check if a given file has an associated prettierconfig.
 * @param filePath file's path
 */
async function checkHasPrettierConfig(filePath: string) {
    const { config } = await resolveConfig(filePath);
    return config !== null;
}

type ResolveConfigResult = {
    config: bundledPrettier.Options | null;
    error?: Error;
};

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
        const config = (await bundledPrettier.resolveConfig(
            filePath,
            options
        )) as bundledPrettier.Options;
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
    additionalConfig: Partial<bundledPrettier.Options>,
    prettierConfig: Partial<bundledPrettier.Options>,
    vscodeConfig: Partial<bundledPrettier.Options>
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
    customOptions: Partial<bundledPrettier.Options>
): Promise<string> {
    const vscodeConfig: PrettierVSCodeConfig = getConfig(uri);
    const localPrettier = requireLocalPkg(
        fileName,
        'prettier'
    ) as typeof bundledPrettier;

    // This has to stay, as it allows to skip in sub workspaceFolders. Sadly noop.
    // wf1  (with "lang") -> glob: "wf1/**"
    // wf1/wf2  (without "lang") -> match "wf1/**"
    if (vscodeConfig.disableLanguages.includes(languageId)) {
        return text;
    }

    const dynamicParsers = getParsersFromLanguageId(
        languageId,
        isUntitled ? undefined : fileName
    );
    let useBundled = false;
    let parser: bundledPrettier.BuiltInParserName | string;

    if (!dynamicParsers.length) {
        const bundledParsers = getParsersFromLanguageId(
            languageId,
            isUntitled ? undefined : fileName,
            true
        );
        parser = bundledParsers[0] || 'babylon';
        useBundled = true;
    } else if (
        vscodeConfig.parser &&
        dynamicParsers.includes(
            vscodeConfig.parser as bundledPrettier.BuiltInParserName
        )
    ) {
        // handle deprecated parser option (parser: "flow")
        parser = vscodeConfig.parser as bundledPrettier.BuiltInParserName;
    } else {
        parser = dynamicParsers[0];
    }
    const doesParserSupportEslint = [
        'javascript',
        'javascriptreact',
        'typescript',
        'typescriptreact',
        'vue'
    ].includes(languageId);

    const hasConfig = await checkHasPrettierConfig(fileName);

    if (!hasConfig && vscodeConfig.requireConfig) {
        return text;
    }

    const { config: fileOptions, error } = await resolveConfig(fileName, {
        editorconfig: true
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
            parser: parser as bundledPrettier.BuiltInParserName,
            semi: vscodeConfig.semi,
            useTabs: vscodeConfig.useTabs,
            proseWrap: vscodeConfig.proseWrap,
            arrowParens: vscodeConfig.arrowParens,
            jsxSingleQuote: vscodeConfig.jsxSingleQuote,
            htmlWhitespaceSensitivity: vscodeConfig.htmlWhitespaceSensitivity,
            endOfLine: vscodeConfig.endOfLine,
            quoteProps: vscodeConfig.quoteProps
        }
    );

    if (vscodeConfig.tslintIntegration && parser === 'typescript') {
        return safeExecution(
            () => {
                const prettierTslint = require('prettier-tslint')
                    .format as PrettierTslintFormat;
                setUsedModule('prettier-tslint', 'Unknown', true);

                return prettierTslint({
                    text,
                    filePath: fileName,
                    fallbackPrettierOptions: prettierOptions
                });
            },
            text,
            fileName
        );
    }

    if (vscodeConfig.eslintIntegration && doesParserSupportEslint) {
        return safeExecution(
            () => {
                const prettierEslint = require('prettier-eslint') as PrettierEslintFormat;
                setUsedModule('prettier-eslint', 'Unknown', true);

                return prettierEslint({
                    text,
                    filePath: fileName,
                    fallbackPrettierOptions: prettierOptions
                });
            },
            text,
            fileName
        );
    }

    if (vscodeConfig.stylelintIntegration && STYLE_PARSERS.includes(parser)) {
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

    public provideDocumentRangeFormattingEdits(
        document: TextDocument,
        range: Range,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this._provideEdits(document, {
            rangeStart: document.offsetAt(range.start),
            rangeEnd: document.offsetAt(range.end)
        });
    }

    public provideDocumentFormattingEdits(
        document: TextDocument,
        options: FormattingOptions,
        token: CancellationToken
    ): Promise<TextEdit[]> {
        return this._provideEdits(document, {});
    }

    private _provideEdits(
        document: TextDocument,
        options: Partial<bundledPrettier.Options>
    ) {
        if (!document.isUntitled && this._fileIsIgnored(document.fileName)) {
            return Promise.resolve([]);
        }
        return format(document.getText(), document, options).then(code => [
            TextEdit.replace(fullDocumentRange(document), code)
        ]);
    }
}

export default PrettierEditProvider;
