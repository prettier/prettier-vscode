import { workspace, Disposable, DocumentSelector, Uri } from 'vscode';
import { PrettierVSCodeConfig } from './types.d';

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
    const config = getConfig();

    return [
        ...config.javascriptEnable,
        ...config.typescriptEnable,
        ...config.cssEnable,
        ...config.jsonEnable,
        ...config.graphqlEnable,
    ];
}
