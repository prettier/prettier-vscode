const ignore = require('ignore');
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';
import { workspace } from 'vscode';

// TODO(azz): make this configurable?
const PRETTIER_IGNORE_FILE = '.prettierignore';

/**
 * Create a file watcher. Reloads the contents of .prettierignore
 * on file change, create, delete.
 */
function fileListener() {
    const fileWatcher = workspace.createFileSystemWatcher(PRETTIER_IGNORE_FILE);

    fileWatcher.onDidChange(reloadIgnoreFile);
    fileWatcher.onDidCreate(reloadIgnoreFile);
    fileWatcher.onDidDelete(reloadIgnoreFile);

    reloadIgnoreFile();

    let ignorer: any;

    return {
        fileWatcher,
        fileIsIgnored(filePath: string) {
            return ignorer && ignorer.ignores(filePath);
        },
    };

    function reloadIgnoreFile() {
        ignorer = null;

        if (workspace.rootPath) {
            const ignorePath = path.join(
                workspace.rootPath,
                PRETTIER_IGNORE_FILE
            );
            if (existsSync(ignorePath)) {
                const ignoreFileContents = readFileSync(ignorePath, 'utf8');
                ignorer = ignore().add(ignoreFileContents);                
            }
        }
    }
}

export default fileListener;
