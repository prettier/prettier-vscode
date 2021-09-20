import { Uri } from "vscode";
import { PrettierBuiltInParserName, PrettierSupportLanguage } from "./types";

export function getParserFromLanguageId(
  languages: PrettierSupportLanguage[],
  uri: Uri,
  languageId: string
): PrettierBuiltInParserName | string | undefined {
  // This is a workaround for when the vscodeLanguageId is duplicated in multiple
  // prettier languages. In these cases the first match is not the preferred match
  // so we override with the parser that exactly matches the languageId.
  // Specific undesired cases here are:
  //  `html` matching to `angular`
  //  `json` matching to `json-stringify`
  const languageParsers = ["html", "json"];
  if (uri.scheme !== "file" && languageParsers.includes(languageId)) {
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
