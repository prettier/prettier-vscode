import * as prettier from "prettier";
import { Uri } from "vscode";
import { PrettierModule } from "./types";

export async function getParserFromLanguageId(
  prettierInstance: PrettierModule,
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
  const language = (await getSupportLanguages(prettierInstance)).find(
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

export async function getSupportedLanguages(
  prettierInstance: PrettierModule
): Promise<string[]> {
  const enabledLanguages: string[] = [];
  (await getSupportLanguages(prettierInstance)).forEach((lang) => {
    if (lang && lang.vscodeLanguageIds) {
      enabledLanguages.push(...lang.vscodeLanguageIds);
    }
  });
  return enabledLanguages.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
}

export function getRangeSupportedLanguages(): string[] {
  return [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "json",
    "graphql",
  ];
}

export async function getSupportedFileExtensions(
  prettierInstance: PrettierModule
) {
  const extensions: string[] = [];
  (await getSupportLanguages(prettierInstance)).forEach((lang) => {
    if (lang && lang.extensions) {
      extensions.push(...lang.extensions);
    }
  });
  return extensions.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
}

async function getSupportLanguages(prettierInstance: PrettierModule) {
  return prettierInstance.getSupportInfo().languages;
}
