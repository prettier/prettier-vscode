import { workspace, Uri } from 'vscode';
import { basename } from 'path';
import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierSupportInfo,
    ParserOption,
} from './types.d';
import { requireLocalPkg } from './requirePkg';

const bundledPrettier = require('prettier') as Prettier;

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
    return workspace.getConfiguration('prettier', uri) as any;
}

export function getParsersFromLanguageId(
    languageId: string,
    prettierInstance: Prettier,
    path?: string
): ParserOption[] {
    const language = getSupportLanguages(prettierInstance).find(
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

export function allEnabledLanguages(): string[] {
    if (!workspace.workspaceFolders) {
        return getSupportLanguages().reduce(
            (ids, language) => [...ids, ...(language.vscodeLanguageIds || [])],
            [] as string[]
        );
    }

    return workspace.workspaceFolders.reduce(
        (ids, workspaceFolder) => {
            const workspacePrettier = requireLocalPkg(
                workspaceFolder.uri.fsPath,
                'prettier'
            ) as Prettier;

            const newLanguages: string[] = [];

            for (const language of getSupportLanguages(workspacePrettier)) {
                if (!language.vscodeLanguageIds) {
                    continue;
                }
                for (const id of language.vscodeLanguageIds) {
                    if (!ids.includes(id)) {
                        newLanguages.push(id);
                    }
                }
            }

            return [...ids, ...newLanguages];
        },
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

export function getGroup(group: string): PrettierSupportInfo['languages'] {
    return getSupportLanguages().filter(language => language.group === group);
}

function getSupportLanguages(prettierInstance: Prettier = bundledPrettier) {
    return prettierInstance.getSupportInfo(prettierInstance.version).languages;
}

export function supportsLanguage(
    vscodeLanguageId: string,
    prettierInstance: Prettier
) {
    return prettierInstance
        .getSupportInfo(prettierInstance.version)
        .languages.some(language => {
            if (!language.vscodeLanguageIds) {
                return false;
            }

            return language.vscodeLanguageIds.includes(vscodeLanguageId);
        });
}
