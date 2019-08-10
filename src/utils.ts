import { workspace, Uri } from 'vscode';
import { basename } from 'path';
import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierSupportInfo,
    ParserOption,
} from './types.d';

const bundledPrettier = require('prettier') as Prettier;
import { requireLocalPkg } from './requirePkg';

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
    return workspace.getConfiguration('prettier', uri) as any;
}

export function getParsersFromLanguageId(
    languageId: string,
    path?: string,
    useBundled: boolean = false
): ParserOption[] {
    const language = getSupportLanguages(useBundled ? undefined : path).find(
        lang =>
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
        'javascript',
        'javascriptreact',
        'typescript',
        'typescriptreact',
        'json',
        'graphql',
    ];
}

export function getGroup(group: string, path?: string): PrettierSupportInfo['languages'] {
    return getSupportLanguages(path).filter(language => language.group === group);
}

function getSupportLanguages(path?: string) {
    let prettierInstance: Prettier;
    if (path) {
        prettierInstance = requireLocalPkg(path, 'prettier');
    } else {
        prettierInstance = bundledPrettier;
    }

    // prettier.getSupportInfo was added in prettier@1.8.0
    if (prettierInstance.getSupportInfo) {
        return prettierInstance.getSupportInfo(prettierInstance.version).languages;
    } else {
        return bundledPrettier.getSupportInfo(prettierInstance.version).languages;
    }
}
