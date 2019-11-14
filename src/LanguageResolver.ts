import * as prettier from "prettier";
import { ModuleResolver } from "./ModuleResolver";

const ESLINT_SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
  "vue"
];

const STYLE_PARSERS = ["postcss", "css", "less", "scss"];

export class LanguageResolver {
  constructor(private moduleResolver: ModuleResolver) {}
  public getParsersFromLanguageId(
    fsPath: string,
    languageId: string
  ): prettier.BuiltInParserName[] | string[] {
    const language = this.getSupportLanguages(fsPath).find(
      lang =>
        lang &&
        lang.extensions &&
        Array.isArray(lang.vscodeLanguageIds) &&
        lang.vscodeLanguageIds.includes(languageId)
    );
    if (!language) {
      return [];
    }
    return language.parsers;
  }

  public allEnabledLanguages(fsPath?: string): string[] {
    const enabledLanguages: string[] = [];
    this.getSupportLanguages(fsPath).forEach(lang => {
      if (lang && lang.vscodeLanguageIds) {
        enabledLanguages.push(...lang.vscodeLanguageIds);
      }
    });
    return enabledLanguages.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  public rangeSupportedLanguages(): string[] {
    return [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
      "json",
      "graphql"
    ];
  }

  public doesLanguageSupportESLint(languageId: string) {
    return ESLINT_SUPPORTED_LANGUAGES.includes(languageId);
  }

  public doesParserSupportStylelint(parser: string) {
    return STYLE_PARSERS.includes(parser);
  }

  private getSupportLanguages(fsPath?: string) {
    const prettierInstance = this.moduleResolver.getPrettierInstance(fsPath);
    return prettierInstance.getSupportInfo().languages;
  }
}
