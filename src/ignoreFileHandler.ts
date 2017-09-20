const ignore = require('ignore');
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { workspace } from 'vscode';

interface Ignorer {
    ignores(filePath: string): boolean;
}

const nullIgnorer: Ignorer = { ignores: () => false };

/**
 * Create a file watcher. Reloads the contents of .prettierignore
 * on file change, create, delete.
 */
function fileListener(ignorePath: string) {
    const fileWatcher = workspace.createFileSystemWatcher(ignorePath);

    fileWatcher.onDidChange(reloadIgnoreFile);
    fileWatcher.onDidCreate(reloadIgnoreFile);
    fileWatcher.onDidDelete(reloadIgnoreFile);

    let ignorer: Ignorer;
    reloadIgnoreFile();

    return {
        fileWatcher,
        fileIsIgnored(filePath: string) {
            return ignorer.ignores(filePath);
        },
    };

    function reloadIgnoreFile() {
        ignorer = nullIgnorer;

        if (workspace.rootPath) {
            const fullIgnorePath = path.isAbsolute(ignorePath)
                ? ignorePath
                : path.join(workspace.rootPath, ignorePath);
            if (existsSync(fullIgnorePath)) {
                const ignoreFileContents = readFileSync(fullIgnorePath, 'utf8');
                ignorer = ignore().add(ignoreFileContents);
            }
        }
    }
}

export default fileListener;
