import * as prettier from "prettier";
import { Uri } from "vscode";

export function getParserFromLanguageId(
  languages: prettier.SupportLanguage[],
  uri: Uri,
  languageId: string
): prettier.BuiltInParserName | string | undefined {
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
  const language = languages.find(
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

export function getSupportedFileNames(languages: prettier.SupportLanguage[]) {
  const fileNames: string[] = [];
  languages.forEach((lang) => {
    if (lang && lang.filenames) {
      fileNames.push(...lang.filenames);
    }
  });
  return fileNames.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
}
