import { workspace } from 'vscode';

let currentRootPath: string = workspace.rootPath;

export function onWorkspaceRootChange(cb: (rootPath: string) => void): void {
    workspace.onDidChangeConfiguration(() => {
        if (currentRootPath !== workspace.rootPath) {
            cb(workspace.rootPath);
            currentRootPath = workspace.rootPath;
        }
    });
}
