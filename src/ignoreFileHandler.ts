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
            const { ignorer, ignoreFilePath } = getIgnorerForFile(filePath);
            return ignorer.ignores(
                path.relative(path.dirname(ignoreFilePath), filePath)
            );
        },
    };

    function getIgnorerForFile(
        fsPath: string
    ): { ignorer: Ignorer; ignoreFilePath: string } {
        const absolutePath = getIgnorePathForFile(
            fsPath,
            getConfig(Uri.file(fsPath)).ignorePath
        );

        if (!absolutePath) {
            return { ignoreFilePath: '', ignorer: nullIgnorer };
        }

        if (!ignorers.has(absolutePath)) {
            loadIgnorer(Uri.file(absolutePath));
        }

        return {
            ignoreFilePath: absolutePath,
            ignorer: ignorers.get(absolutePath)!,
        };
    }

    function loadIgnorer(ignoreUri: Uri) {
        let ignorer = nullIgnorer;

        if (!ignorers.has(ignoreUri.fsPath)) {
            const fileWatcher = workspace.createFileSystemWatcher(
                ignoreUri.fsPath
            );
            disposables.push(fileWatcher);

            fileWatcher.onDidCreate(loadIgnorer, null, disposables);
            fileWatcher.onDidChange(loadIgnorer, null, disposables);
            fileWatcher.onDidDelete(unloadIgnorer, null, disposables);
        }
        if (existsSync(ignoreUri.fsPath)) {
            const ignoreFileContents = readFileSync(ignoreUri.fsPath, 'utf8');
            ignorer = ignore().add(ignoreFileContents);
        }

        ignorers.set(ignoreUri.fsPath, ignorer);
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
    if (!existsSync(ignorePath)) {
        return null;
    }
    if (workspace.workspaceFolders) {
        const folder = workspace.getWorkspaceFolder(Uri.file(filePath));
        return folder ? getPath(ignorePath, folder.uri.fsPath) : null;
    }

    return null;
}

function getPath(fsPath: string, relativeTo: string) {
    return path.isAbsolute(fsPath) ? fsPath : path.join(relativeTo, fsPath);
}

export default ignoreFileHandler;
