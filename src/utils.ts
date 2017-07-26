import { workspace, Disposable, DocumentSelector } from 'vscode';
import { PrettierVSCodeConfig } from './types.d';

let currentRootPath: string = workspace.rootPath;

export function onWorkspaceRootChange(
    cb: (rootPath: string) => void
): Disposable {
    return workspace.onDidChangeConfiguration(() => {
        if (currentRootPath !== workspace.rootPath) {
            cb(workspace.rootPath);
            currentRootPath = workspace.rootPath;
        }
    });
}

export function getConfig(): PrettierVSCodeConfig {
    return workspace.getConfiguration('prettier') as any;
}

export function allEnabledLanguages(): DocumentSelector {
    const config = getConfig();

    return [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
        ...config.cssEnable,
        ...config.jsonEnable,
        ...config.graphqlEnable,
    ];
}
