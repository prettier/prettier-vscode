import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { Uri } from "vscode";
import { ModuleResolver } from "./ModuleResolver";

const ESLINT_SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
  "vue",
];

const STYLE_PARSERS = ["postcss", "css", "less", "scss"];

export class LanguageResolver {
  constructor(private moduleResolver: ModuleResolver) {}
  public getParsersFromLanguageId(
    uri: Uri,
    languageId: string
  ): prettier.BuiltInParserName[] | string[] {
    if (uri.scheme === "untitled" && languageId === "html") {
      // This is a workaround for the HTML language when it is unsaved. By default,
      // the Angular parser matches first because both register the language 'html'
      return ["html"];
    }
    const language = this.getSupportLanguages(uri.fsPath).find(
      (lang) =>
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
    this.getSupportLanguages(fsPath).forEach((lang) => {
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
      "arm-template",
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
      "json",      
      "graphql",
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
