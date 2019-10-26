import * as prettier from "prettier";
import { PrettierModule } from "./types.d";

const ESLINT_SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
  "vue"
];

const STYLE_PARSERS = ["postcss", "css", "less", "scss"];

export class LanguageResolver {
  constructor(private prettierInstance: PrettierModule) {}
  public getParsersFromLanguageId(
    languageId: string
  ): prettier.BuiltInParserName[] | string[] {
    const language = this.getSupportLanguages().find(
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

  public allEnabledLanguages(): string[] {
    return this.getSupportLanguages()
      .reduce(
        (ids, language) => [...ids, ...(language.vscodeLanguageIds || [])],
        [] as string[]
      )
      .filter((value, index, self) => {
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

  private getSupportLanguages() {
    return this.prettierInstance.getSupportInfo().languages;
  }
}
