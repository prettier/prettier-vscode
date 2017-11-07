import { workspace, Disposable, DocumentSelector, Uri } from 'vscode';
import { PrettierVSCodeConfig, Prettier, PrettierSupportInfo } from './types.d';

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

export function allEnabledLanguages(): DocumentSelector {
    return (require('prettier') as Prettier)
        .getSupportInfo()
        .languages.reduce(
            (ids, language) => [...ids, ...language.vscodeLanguageIds],
            []
        );
}

export function allJSLanguages(): DocumentSelector {
    return getGroup('JavaScript')
        .filter(language => language.group === 'JavaScript')
        .reduce((ids, language) => [...ids, ...language.vscodeLanguageIds], []);
}

export function getGroup(group: string): PrettierSupportInfo['languages'] {
    return (require('prettier') as Prettier)
        .getSupportInfo()
        .languages.filter(language => language.group === group);
}
