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
  ParserOption,
  Prettier,
  PrettierConfig,
  PrettierEslintFormat,
  PrettierStylelint,
  PrettierTslintFormat,
  PrettierVSCodeConfig
} from './types.d';
import {
  eslintSupportedLanguages,
  getConfig,
  getParsersFromLanguageId,
  stylelintSupportedParsers,
  typescriptSupportedParser
} from './utils';

const bundledPrettier = require('prettier') as Prettier;

/**
 * Check if a given file has an associated prettier config.
 * @param filePath file's path
 */
async function hasPrettierConfig(filePath: string): Promise<boolean> {
  const { config } = await resolveConfig(filePath);
  return !!config;
}

type ResolveConfigResult = { config: PrettierConfig | null; error?: Error };

/**
 * Resolves the prettier config for the given file.
 * @param filePath file's path
 */
async function resolveConfig(filePath: string, options?: { editorconfig?: boolean }): Promise<ResolveConfigResult> {
  try {
    const config = await bundledPrettier.resolveConfig(filePath, options);
    return { config };
  } catch (error) {
    return { config: null, error };
  }
}

/**
 * Define which config should be used.
 * If a prettier config exists, it returns itself.
 * It merges prettier config into VS Code's config (`.editorconfig`).
 * Priority:
 * - `additionalConfig`
 * - `prettierConfig`
 * - `vscodeConfig`
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
  if (hasPrettierConfig) {
    // Always merge our inferred parser in
    return { parser: vscodeConfig.parser, ...prettierConfig, ...additionalConfig };
  }
  return { ...vscodeConfig, ...prettierConfig, ...additionalConfig };
}
/**
 * Format the given text with user's configuration.
 * @param text text to format
 * @param path formatting file's path
 * @returns formatted text
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

  const dynamicParsers = getParsersFromLanguageId(languageId, localPrettier, isUntitled ? undefined : fileName);
  let useBundled = false;
  let parser: ParserOption = 'none';

  if (dynamicParsers.length !== 0) {
    const bundledParsers = getParsersFromLanguageId(languageId, bundledPrettier, isUntitled ? undefined : fileName);
    if (bundledParsers[0]) {
      parser = bundledParsers[0];
    }
    useBundled = true;
  } else if (dynamicParsers.includes(vscodeConfig.parser)) {
    // Handle deprecated parser option
    parser = vscodeConfig.parser;
  } else {
    parser = dynamicParsers[0];
  }

  const hasConfig = await hasPrettierConfig(fileName);
  if (!hasConfig && vscodeConfig.requireConfig) {
    return text;
  }

  const { config: fileOptions, error } = await resolveConfig(fileName, { editorconfig: true });
  if (error) {
    addToOutput(`Failed to resolve config for ${fileName}. Falling back to the default config settings.`);
  }

  const prettierOptions = mergeConfig(hasConfig, customOptions, fileOptions || {}, {
    printWidth: vscodeConfig.printWidth,
    tabWidth: vscodeConfig.tabWidth,
    singleQuote: vscodeConfig.singleQuote,
    trailingComma: vscodeConfig.trailingComma,
    bracketSpacing: vscodeConfig.bracketSpacing,
    jsxBracketSameLine: vscodeConfig.jsxBracketSameLine,
    semi: vscodeConfig.semi,
    useTabs: vscodeConfig.useTabs,
    proseWrap: vscodeConfig.proseWrap,
    arrowParens: vscodeConfig.arrowParens,
    jsxSingleQuote: vscodeConfig.jsxSingleQuote,
    htmlWhitespaceSensitivity: vscodeConfig.htmlWhitespaceSensitivity,
    endOfLine: vscodeConfig.endOfLine,
    quoteProps: vscodeConfig.quoteProps,
    parser
  });

  if (vscodeConfig.tslintIntegration && typescriptSupportedParser === parser) {
    return safeExecution(
      () => {
        const prettierTslint = require('prettier-tslint').format as PrettierTslintFormat;

        setUsedModule('prettier-tslint', '0.4.2', true);

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

  const doesParserSupportEslint = eslintSupportedLanguages.includes(languageId);
  if (vscodeConfig.eslintIntegration && doesParserSupportEslint) {
    return safeExecution(
      () => {
        const prettierEslint = require('prettier-eslint') as PrettierEslintFormat;

        setUsedModule('prettier-eslint', '9.0.0', true);

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

  if (vscodeConfig.stylelintIntegration && stylelintSupportedParsers.includes(parser)) {
    const prettierStylelint = require('prettier-stylelint') as PrettierStylelint;

    setUsedModule('prettier-stylelint', '0.4.2', true);

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
        addToOutput(
          `prettier@${localPrettier.version} doesn't support ${languageId}. Falling back to bundled prettier@${bundledPrettier.version}.`
        );

        setUsedModule('prettier', bundledPrettier.version, true);

        return bundledPrettier.format(text, prettierOptions);
      },
      text,
      fileName
    );
  }

  setUsedModule('prettier', localPrettier.version, false);

  return safeExecution(() => localPrettier.format(text, prettierOptions), text, fileName);
}

function fullDocumentRange(document: TextDocument): Range {
  const lastLineId = document.lineCount - 1;
  return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

export class PrettierEditProvider implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider {
  constructor(private _fileIsIgnored: (filePath: string) => boolean) {}

  provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    _options: FormattingOptions,
    _token: CancellationToken
  ): Promise<TextEdit[]> {
    return this._provideEdits(document, {
      rangeStart: document.offsetAt(range.start),
      rangeEnd: document.offsetAt(range.end)
    });
  }

  provideDocumentFormattingEdits(
    document: TextDocument,
    _options: FormattingOptions,
    _token: CancellationToken
  ): Promise<TextEdit[]> {
    return this._provideEdits(document, {});
  }

  private _provideEdits(document: TextDocument, options: Partial<PrettierConfig>): Promise<TextEdit[]> {
    if (!document.isUntitled && this._fileIsIgnored(document.fileName)) {
      return Promise.resolve([]);
    }

    return format(document.getText(), document, options).then(code => [
      TextEdit.replace(fullDocumentRange(document), code)
    ]);
  }
}
