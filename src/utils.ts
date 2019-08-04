import { basename } from 'path';
import { Uri, workspace } from 'vscode';
import { ParserOption, Prettier, PrettierSupportInfo, PrettierVSCodeConfig } from './types.d';

const bundledPrettier = require('prettier') as Prettier;

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
  return workspace.getConfiguration('prettier', uri) as any;
}

export function getParsersFromLanguageId(
  languageId: string,
  prettierInstance: Prettier,
  path?: string
): ParserOption[] {
  const language = getSupportLanguages(prettierInstance).find(lang => {
    return (
      Array.isArray(lang.vscodeLanguageIds) &&
      lang.vscodeLanguageIds.includes(languageId) &&
      // Only for some specific filenames
      (lang.extensions.length > 0 ||
        (typeof path === 'string' && Array.isArray(lang.filenames) && lang.filenames.includes(basename(path))))
    );
  });

  return language ? language.parsers : [];
}

export const allEnabledLanguages: string[] = getSupportLanguages().reduce((ids: string[], lang) => {
  if (lang.vscodeLanguageIds) {
    ids.push(...lang.vscodeLanguageIds);
  }
  return ids;
}, []);

// TODO(@svipas): should we add more supported languages here?
export const supportedLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'json', 'graphql'];
export const eslintSupportedLanguages = ['javascript', 'javascriptreact', 'typescript', 'typescriptreact', 'vue'];
export const stylelintSupportedParsers: ParserOption[] = ['css', 'less', 'scss'];
export const typescriptSupportedParser: ParserOption = 'typescript';

export function getGroup(group: string): PrettierSupportInfo['languages'] {
  return getSupportLanguages().filter(language => language.group === group);
}

function getSupportLanguages(prettierInstance: Prettier = bundledPrettier) {
  // `prettier.getSupportInfo` was added in v1.8.0
  if (prettierInstance.getSupportInfo) {
    return prettierInstance.getSupportInfo(prettierInstance.version).languages;
  } else {
    return bundledPrettier.getSupportInfo(prettierInstance.version).languages;
  }
}
