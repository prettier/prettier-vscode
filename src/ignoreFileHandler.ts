import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { Disposable, Uri, workspace } from 'vscode';
import { addToOutput } from './errorHandler';
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
export function ignoreFileHandler(disposables: Disposable[]) {
  let ignorers: { [key: string]: Ignorer } = {};
  disposables.push({ dispose: () => (ignorers = {}) });

  const unloadIgnorer = (ignoreUri: Uri) => (ignorers[ignoreUri.fsPath] = nullIgnorer);

  const loadIgnorer = (ignoreUri: Uri) => {
    let ignorer = nullIgnorer;

    if (!ignorers[ignoreUri.fsPath]) {
      const fileWatcher = workspace.createFileSystemWatcher(ignoreUri.fsPath);
      disposables.push(fileWatcher);
      fileWatcher.onDidCreate(loadIgnorer, null, disposables);
      fileWatcher.onDidChange(loadIgnorer, null, disposables);
      fileWatcher.onDidDelete(unloadIgnorer, null, disposables);
    }

    if (existsSync(ignoreUri.fsPath)) {
      const ignoreFileContents = readFileSync(ignoreUri.fsPath, 'utf8');
      ignorer = ignore().add(ignoreFileContents);
    }

    ignorers[ignoreUri.fsPath] = ignorer;
  };

  const getIgnorerForFile = (fsPath: string): { ignorer: Ignorer; ignoreFilePath: string } => {
    const absolutePath = getIgnorePathForFile(fsPath, getConfig(Uri.file(fsPath)).ignorePath);
    if (!absolutePath) {
      return { ignoreFilePath: '', ignorer: nullIgnorer };
    }

    if (!ignorers[absolutePath]) {
      loadIgnorer(Uri.file(absolutePath));
    }

    if (!existsSync(absolutePath)) {
      // Don't log default value
      const ignorePath = getConfig(Uri.file(fsPath)).ignorePath;
      if (ignorePath !== '.prettierignore') {
        addToOutput(`Wrong "prettier.ignorePath" provided in your settings. The path ${ignorePath} does not exist.`);
      }
      return { ignoreFilePath: '', ignorer: nullIgnorer };
    }
    return {
      ignoreFilePath: absolutePath,
      ignorer: ignorers[absolutePath]
    };
  };

  return {
    fileIsIgnored(filePath: string) {
      const { ignorer, ignoreFilePath } = getIgnorerForFile(filePath);
      return ignorer.ignores(path.relative(path.dirname(ignoreFilePath), filePath));
    }
  };
}

function getIgnorePathForFile(filePath: string, ignorePath: string): string | null {
  // Configuration `prettier.ignorePath` is set to `null`
  if (!ignorePath) {
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
