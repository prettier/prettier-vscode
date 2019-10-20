import * as prettier from "prettier";
import {
  CancellationToken,
  DocumentFormattingEditProvider,
  DocumentRangeFormattingEditProvider,
  FormattingOptions,
  Range,
  TextDocument,
  TextEdit
  // tslint:disable-next-line: no-implicit-dependencies
} from "vscode";
import { addToOutput, safeExecution, setUsedModule } from "./errorHandler";
import { PrettierResolver } from "./PrettierResolver";
import {
  IPrettierStylelint,
  PrettierEslintFormat,
  PrettierTslintFormat,
  PrettierVSCodeConfig
} from "./types.d";
import { getConfig, getParsersFromLanguageId } from "./utils";

/**
 * HOLD style parsers (for stylelint integration)
 */
const STYLE_PARSERS: string[] = ["postcss", "css", "less", "scss"];
/**
 * Check if a given file has an associated prettierconfig.
 * @param filePath file's path
 */
async function checkHasPrettierConfig(filePath: string) {
  const { config } = await resolveConfig(filePath);
  return config !== null;
}

interface IResolveConfigResult {
  config: prettier.Options | null;
  error?: Error;
}

/**
 * Resolves the prettierconfig for the given file.
 *
 * @param filePath file's path
 */
async function resolveConfig(
  filePath: string,
  options?: { editorconfig?: boolean }
): Promise<IResolveConfigResult> {
  try {
    const config = (await prettier.resolveConfig(
      filePath,
      options
    )) as prettier.Options;
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
  additionalConfig: Partial<prettier.Options>,
  prettierConfig: Partial<prettier.Options>,
  vscodeConfig: Partial<prettier.Options>
) {
  return hasPrettierConfig
    ? {
        parser: vscodeConfig.parser, // always merge our inferred parser in
        ...prettierConfig,
        ...additionalConfig
      }
    : { ...vscodeConfig, ...prettierConfig, ...additionalConfig };
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
  customOptions: Partial<prettier.Options>
): Promise<string> {
  const vscodeConfig: PrettierVSCodeConfig = getConfig(uri);
  const prettierInstance = PrettierResolver.getPrettierInstance(fileName);

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
  let parser: prettier.BuiltInParserName | string;

  if (!dynamicParsers.length) {
    const bundledParsers = getParsersFromLanguageId(
      languageId,
      isUntitled ? undefined : fileName,
      true
    );
    parser = bundledParsers[0] || "babylon";
    useBundled = true;
  } else if (
    vscodeConfig.parser &&
    dynamicParsers.includes(vscodeConfig.parser as prettier.BuiltInParserName)
  ) {
    // handle deprecated parser option (parser: "flow")
    parser = vscodeConfig.parser as prettier.BuiltInParserName;
  } else {
    parser = dynamicParsers[0];
  }
  const doesParserSupportEslint = [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
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
      arrowParens: vscodeConfig.arrowParens,
      bracketSpacing: vscodeConfig.bracketSpacing,
      endOfLine: vscodeConfig.endOfLine,
      htmlWhitespaceSensitivity: vscodeConfig.htmlWhitespaceSensitivity,
      jsxBracketSameLine: vscodeConfig.jsxBracketSameLine,
      jsxSingleQuote: vscodeConfig.jsxSingleQuote,
      parser: parser as prettier.BuiltInParserName,
      printWidth: vscodeConfig.printWidth,
      proseWrap: vscodeConfig.proseWrap,
      quoteProps: vscodeConfig.quoteProps,
      semi: vscodeConfig.semi,
      singleQuote: vscodeConfig.singleQuote,
      tabWidth: vscodeConfig.tabWidth,
      trailingComma: vscodeConfig.trailingComma,
      useTabs: vscodeConfig.useTabs
    }
  );
  prettierOptions.filepath = fileName;

  if (vscodeConfig.tslintIntegration && parser === "typescript") {
    return safeExecution(
      () => {
        const prettierTslint = require("prettier-tslint")
          .format as PrettierTslintFormat;
        setUsedModule("prettier-tslint", "Unknown", true);

        return prettierTslint({
          fallbackPrettierOptions: prettierOptions,
          filePath: fileName,
          text
        });
      },
      text,
      fileName
    );
  }

  if (vscodeConfig.eslintIntegration && doesParserSupportEslint) {
    return safeExecution(
      () => {
        const prettierEslint = require("prettier-eslint") as PrettierEslintFormat;
        setUsedModule("prettier-eslint", "Unknown", true);

        return prettierEslint({
          fallbackPrettierOptions: prettierOptions,
          filePath: fileName,
          text
        });
      },
      text,
      fileName
    );
  }

  if (vscodeConfig.stylelintIntegration && STYLE_PARSERS.includes(parser)) {
    const prettierStylelint = require("prettier-stylelint") as IPrettierStylelint;
    return safeExecution(
      prettierStylelint.format({
        filePath: fileName,
        prettierOptions,
        text
      }),
      text,
      fileName
    );
  }

  if (!doesParserSupportEslint && useBundled) {
    return safeExecution(
      () => {
        const warningMessage =
          `prettier@${prettierInstance.version} doesn't support ${languageId}. ` +
          `Falling back to bundled prettier@${prettier.version}.`;

        addToOutput(warningMessage);

        setUsedModule("prettier", prettier.version, true);

        return prettier.format(text, prettierOptions);
      },
      text,
      fileName
    );
  }

  setUsedModule("prettier", prettierInstance.version, false);

  return safeExecution(
    () => prettierInstance.format(text, prettierOptions),
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
  constructor(private fileIsIgnored: (filePath: string) => boolean) {}

  public provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this._provideEdits(document, {
      rangeEnd: document.offsetAt(range.end),
      rangeStart: document.offsetAt(range.start)
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
    options: Partial<prettier.Options>
  ) {
    if (!document.isUntitled && this.fileIsIgnored(document.fileName)) {
      return Promise.resolve([]);
    }
    return format(document.getText(), document, options).then(code => [
      TextEdit.replace(fullDocumentRange(document), code)
    ]);
  }
}

export default PrettierEditProvider;
