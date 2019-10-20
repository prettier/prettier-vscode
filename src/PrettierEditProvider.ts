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

interface IResolveConfigResult {
  config: prettier.Options | null;
  error?: Error;
}

class PrettierEditProvider
  implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider {
  constructor(
    private moduleResolver: ModuleResolver,
    private ignoreResolver: IgnorerResolver
  ) {}

  public provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this.provideEdits(document, {
      rangeEnd: document.offsetAt(range.end),
      rangeStart: document.offsetAt(range.start)
    });
  }

  public provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): Promise<TextEdit[]> {
    return this.provideEdits(document, {});
  }

  private provideEdits(
    document: TextDocument,
    options: Partial<prettier.Options>
  ) {
    return this.format(document.getText(), document, options).then(code => [
      TextEdit.replace(this.fullDocumentRange(document), code)
    ]);
  }

  /**
   * Format the given text with user's configuration.
   * @param text Text to format
   * @param path formatting file's path
   * @returns {string} formatted text
   */
  private async format(
    text: string,
    { fileName, languageId, uri, isUntitled }: TextDocument,
    customOptions: Partial<prettier.Options>
  ): Promise<string> {
    const vscodeConfig: PrettierVSCodeConfig = getConfig(uri);
    const prettierInstance = this.moduleResolver.getPrettierInstance(fileName);
    const languageResolver = new LanguageResolver(prettierInstance);

    // This has to stay, as it allows to skip in sub workspaceFolders. Sadly noop.
    // wf1  (with "lang") -> glob: "wf1/**"
    // wf1/wf2  (without "lang") -> match "wf1/**"
    if (vscodeConfig.disableLanguages.includes(languageId)) {
      return text;
    }

    let fileInfo: prettier.FileInfoResult | undefined;
    let parser: prettier.BuiltInParserName | string | undefined;

    const ignorePath = this.ignoreResolver.getIgnorePath(fileName);

    if (fileName) {
      fileInfo = await prettierInstance.getFileInfo(fileName, { ignorePath });
    }

    if (fileInfo && fileInfo.ignored) {
      return text;
    }

    const dynamicParsers = languageResolver.getParsersFromLanguageId(
      languageId
    );
    if (dynamicParsers.length > 0) {
      parser = dynamicParsers[0];
    } else if (fileInfo && fileInfo.inferredParser) {
      parser = fileInfo.inferredParser;
    }

    if (!parser) {
      addToOutput(`Failed to resolve config for ${fileName}.`);
      return text;
    }

    const hasConfig = await this.checkHasPrettierConfig(fileName);

    if (!hasConfig && vscodeConfig.requireConfig) {
      return text;
    }

    const { config: fileOptions, error } = await this.resolveConfig(fileName, {
      editorconfig: true
    });

    if (error) {
      addToOutput(
        `Failed to resolve config for ${fileName}. Falling back to the default config settings.`
      );
    }

    const prettierOptions = this.mergeConfig(
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
      const prettierTslintModule = this.moduleResolver.requireLocalPkg(
        fileName,
        "prettier-tslint"
      );

      if (prettierTslintModule) {
        return safeExecution(
          () => {
            const prettierTslintFormat = prettierTslintModule.format as PrettierTslintFormat;

            setUsedModule("prettier-tslint", "Unknown", true);

            return prettierTslintFormat({
              fallbackPrettierOptions: prettierOptions,
              filePath: fileName,
              text
            });
          },
          text,
          fileName
        );
      }
    }

    if (
      vscodeConfig.eslintIntegration &&
      languageResolver.doesLanguageSupportESLint(languageId)
    ) {
      const prettierEslintModule = this.moduleResolver.requireLocalPkg(
        fileName,
        "prettier-eslint"
      );
      if (prettierEslintModule) {
        return safeExecution(
          () => {
            const prettierEslintFormat = prettierEslintModule as PrettierEslintFormat;
            setUsedModule("prettier-eslint", "Unknown", true);

            return prettierEslintFormat({
              fallbackPrettierOptions: prettierOptions,
              filePath: fileName,
              text
            });
          },
          text,
          fileName
        );
      }
    }

    if (
      vscodeConfig.stylelintIntegration &&
      languageResolver.doesParserSupportStylelint(parser)
    ) {
      const prettierStylelintModule = this.moduleResolver.requireLocalPkg(
        fileName,
        "prettier-stylelint"
      );
      if (prettierStylelintModule) {
        const prettierStylelint = prettierStylelintModule as IPrettierStylelint;
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
    }

    setUsedModule("prettier", prettierInstance.version, false);

    return safeExecution(
      () => prettierInstance.format(text, prettierOptions),
      text,
      fileName
    );
  }

  /**
   * Check if a given file has an associated prettierconfig.
   * @param filePath file's path
   */
  private async checkHasPrettierConfig(filePath: string) {
    const { config } = await this.resolveConfig(filePath);
    return config !== null;
  }

  private fullDocumentRange(document: TextDocument): Range {
    const lastLineId = document.lineCount - 1;
    return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
  }

  /**
   * Resolves the prettierconfig for the given file.
   *
   * @param filePath file's path
   */
  private async resolveConfig(
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
  private mergeConfig(
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
}

export default PrettierEditProvider;
