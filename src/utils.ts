import { basename } from "path";
import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { Uri, workspace } from "vscode";
import { requireLocalPkg } from "./requirePkg";
import { PrettierVSCodeConfig } from "./types.d";

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
  return workspace.getConfiguration("prettier", uri) as any;
}

export function getParsersFromLanguageId(
  languageId: string,
  path?: string,
  useBundled: boolean = false
): prettier.BuiltInParserName[] | string[] {
  const language = getSupportLanguages(useBundled ? undefined : path).find(
    lang =>
      lang &&
      lang.extensions &&
      Array.isArray(lang.vscodeLanguageIds) &&
      lang.vscodeLanguageIds.includes(languageId) &&
      // Only for some specific filenames
      (lang.extensions.length > 0 ||
        (path != null &&
          lang.filenames != null &&
          lang.filenames.includes(basename(path))))
  );
  if (!language) {
    return [];
  }
  return language.parsers;
}

export function allEnabledLanguages(path?: string): string[] {
  return getSupportLanguages(path).reduce(
    (ids, language) => [...ids, ...(language.vscodeLanguageIds || [])],
    [] as string[]
  );
}

export function rangeSupportedLanguages(): string[] {
  return [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "json",
    "graphql"
  ];
}

export function getGroup(
  group: string,
  path?: string
): prettier.SupportInfo["languages"] {
  return getSupportLanguages(path).filter(language => language.group === group);
}

function getSupportLanguages(path?: string) {
  let prettierInstance: typeof prettier;
  prettierInstance = path ? requireLocalPkg(path, "prettier") : prettier;

  // prettier.getSupportInfo was added in prettier@1.8.0
  if (prettierInstance.getSupportInfo) {
    return prettierInstance.getSupportInfo(prettierInstance.version).languages;
  } else {
    return prettier.getSupportInfo(prettierInstance.version).languages;
  }
}
