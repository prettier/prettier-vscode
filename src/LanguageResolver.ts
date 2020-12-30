import * as prettier from "prettier";
import { Uri } from "vscode";
import { ModuleResolver } from "./ModuleResolver";

export class LanguageResolver {
  constructor(private moduleResolver: ModuleResolver) {}
  public async getParserFromLanguageId(
    uri: Uri,
    languageId: string
  ): Promise<prettier.BuiltInParserName | string | undefined> {
    // This is a workaround for when the vscodeLanguageId is duplicated in multiple
    // prettier languages. In these cases the first match is not the preferred match
    // so we override with the parser that exactly matches the languageId.
    // Specific undesired cases here are:
    //  `html` matching to `angular`
    //  `json` matching to `json-stringify`
    const languageParsers = ["html", "json"];
    if (uri.scheme === "untitled" && languageParsers.includes(languageId)) {
      return languageId;
    }
    const language = (await this.getSupportLanguages(uri.fsPath)).find(
      (lang) =>
        lang &&
        lang.extensions &&
        Array.isArray(lang.vscodeLanguageIds) &&
        lang.vscodeLanguageIds.includes(languageId)
    );
    if (language && language.parsers?.length > 0) {
      return language.parsers[0];
    }
  }

  public async getSupportedLanguages(fsPath?: string): Promise<string[]> {
    const enabledLanguages: string[] = [];
    (await this.getSupportLanguages(fsPath)).forEach((lang) => {
      if (lang && lang.vscodeLanguageIds) {
        enabledLanguages.push(...lang.vscodeLanguageIds);
      }
    });
    return enabledLanguages.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  public getRangeSupportedLanguages(): string[] {
    return [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
      "json",
      "graphql",
    ];
  }

  public async getSupportedFileExtensions(fsPath?: string) {
    const extensions: string[] = [];
    (await this.getSupportLanguages(fsPath)).forEach((lang) => {
      if (lang && lang.extensions) {
        extensions.push(...lang.extensions);
      }
    });
    return extensions.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  private async getSupportLanguages(fsPath?: string) {
    const prettierInstance = await this.moduleResolver.getPrettierInstance(
      fsPath
    );
    return prettierInstance.getSupportInfo().languages;
  }
}
