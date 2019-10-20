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
import { getConfig } from "./ConfigResolver";
import { addToOutput, safeExecution, setUsedModule } from "./errorHandler";
import { IgnorerResolver } from "./IgnorerResolver";
import { LanguageResolver } from "./LanguageResolver";
import { ModuleResolver } from "./ModuleResolver";
import {
  IPrettierStylelint,
  PrettierEslintFormat,
  PrettierTslintFormat,
  PrettierVSCodeConfig
} from "./types.d";

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
  const moduleResolver = new ModuleResolver();
  const prettierInstance = moduleResolver.getPrettierInstance(fileName);
  const languageResolver = new LanguageResolver(prettierInstance);
  const ignoreReslver = new IgnorerResolver();

  // This has to stay, as it allows to skip in sub workspaceFolders. Sadly noop.
  // wf1  (with "lang") -> glob: "wf1/**"
  // wf1/wf2  (without "lang") -> match "wf1/**"
  if (vscodeConfig.disableLanguages.includes(languageId)) {
    return text;
  }

  let fileInfo: prettier.FileInfoResult | undefined;
  let parser: prettier.BuiltInParserName | string | undefined;

  const ignorePath = ignoreReslver.getIgnorePath(fileName);

  if (fileName) {
    fileInfo = await prettierInstance.getFileInfo(fileName, { ignorePath });
  }

  if (fileInfo && fileInfo.ignored) {
    return text;
  }

  const dynamicParsers = languageResolver.getParsersFromLanguageId(languageId);
  if (dynamicParsers.length > 0) {
    parser = dynamicParsers[0];
  } else if (fileInfo && fileInfo.inferredParser) {
    parser = fileInfo.inferredParser;
  }

  if (!parser) {
    addToOutput(`Failed to resolve config for ${fileName}.`);
    return text;
  }

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
      filepath: fileName,
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

  if (
    vscodeConfig.eslintIntegration &&
    languageResolver.doesLanguageSupportESLint(languageId)
  ) {
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

  if (
    vscodeConfig.stylelintIntegration &&
    languageResolver.doesParserSupportStylelint(parser)
  ) {
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
    // if (!document.isUntitled && this.fileIsIgnored(document.fileName)) {
    //   return Promise.resolve([]);
    // }
    return format(document.getText(), document, options).then(code => [
      TextEdit.replace(fullDocumentRange(document), code)
    ]);
  }
}

export default PrettierEditProvider;
