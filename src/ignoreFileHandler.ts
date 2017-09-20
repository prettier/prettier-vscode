import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { workspace, Uri, Disposable } from 'vscode';
import { getConfig } from './utils';

const ignore = require('ignore');

interface Ignorer {
    ignores(filePath: string): boolean;
}

const nullIgnorer: Ignorer = { ignores: () => false };

/**
 * Create an ignore file handler. Will lazily read ignore files on a per-resource
 * basis, and cache the contents until it changes.
 */
function ignoreFileHandler(disposables: Disposable[]) {
    const ignorers = new Map<string, Ignorer>();
    disposables.push({ dispose: () => ignorers.clear() });

    return {
        fileIsIgnored(filePath: string) {
            return getIgnorerForFile(filePath).ignores(filePath);
        },
    };

    function getIgnorerForFile(fsPath: string): Ignorer {
        const absolutePath = getIgnorePathForFile(
            fsPath,
            getConfig(Uri.file(fsPath)).ignorePath
        );

        if (!absolutePath) {
            return nullIgnorer;
        }

        if (ignorers.has(absolutePath)) {
            return ignorers.get(absolutePath)!;
        }

        return loadIgnorer(Uri.file(absolutePath));
    }

    function loadIgnorer(ignoreUri: Uri): Ignorer {
        let ignorer = nullIgnorer;

        if (!ignorers.has(ignoreUri.fsPath)) {
            const fileWatcher = workspace.createFileSystemWatcher(
                ignoreUri.fsPath
            );
            fileWatcher.onDidCreate(loadIgnorer, null, disposables);
            fileWatcher.onDidChange(loadIgnorer, null, disposables);
            fileWatcher.onDidDelete(unloadIgnorer, null, disposables);
        }
        if (existsSync(ignoreUri.fsPath)) {
            const ignoreFileContents = readFileSync(ignoreUri.fsPath, 'utf8');
            ignorer = ignore().add(ignoreFileContents);
        }

        ignorers.set(ignoreUri.fsPath, ignorer);
        return ignorer;
    }

    function unloadIgnorer(ignoreUri: Uri) {
        ignorers.set(ignoreUri.fsPath, nullIgnorer);
    }
}

function getIgnorePathForFile(
    filePath: string,
    ignorePath: string
): string | null {
    // Configuration `prettier.ignorePath` is set to `null`
    if (!ignorePath) {
        return null;
    }
    if (workspace.rootPath) {
        return getPath(workspace.rootPath);
    }
    if (workspace.workspaceFolders) {
        const folder = workspace.getWorkspaceFolder(Uri.file(filePath));
        return folder ? getPath(folder.uri.fsPath) : null;
    }

    return null;

    function getPath(relativeTo: string) {
        return path.isAbsolute(ignorePath)
            ? ignorePath
            : path.join(relativeTo, ignorePath);
    }
}

export default ignoreFileHandler;
