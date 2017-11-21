import { workspace, Disposable, DocumentSelector, Uri } from 'vscode';
import {
    PrettierVSCodeConfig,
    Prettier,
    PrettierSupportInfo,
    ParserOption,
} from './types.d';

let currentRootPath: string = workspace.rootPath!;

export function onWorkspaceRootChange(
    cb: (rootPath: string) => void
): Disposable {
    // TODO: use `workspace.onDidChangeWorkspaceFolders`

    return workspace.onDidChangeConfiguration(() => {
        if (currentRootPath !== workspace.rootPath) {
            cb(workspace.rootPath!);
            currentRootPath = workspace.rootPath!;
        }
    });
}

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
    return workspace.getConfiguration('prettier', uri) as any;
}

export function getParsersFromLanguageId(
    languageId: string,
    version: string
): ParserOption[] {
    const language = getSupportLanguages().find(lang =>
        lang.vscodeLanguageIds.includes(languageId)
    );
    if (!language) {
        return [];
    }
    return language.parsers;
}

export function allEnabledLanguages(): DocumentSelector {
    return getSupportLanguages().reduce(
        (ids, language) => [...ids, ...language.vscodeLanguageIds],
        [] as string[]
    );
}

export function allJSLanguages(): DocumentSelector {
    return getGroup('JavaScript')
        .filter(language => language.group === 'JavaScript')
        .reduce(
            (ids, language) => [...ids, ...language.vscodeLanguageIds],
            [] as string[]
        );
}

export function getGroup(group: string): PrettierSupportInfo['languages'] {
    return getSupportLanguages().filter(language => language.group === group);
}

function getSupportLanguages() {
    return (require('prettier') as Prettier).getSupportInfo().languages;
}
