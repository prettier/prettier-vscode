import { workspace } from 'vscode';
import { Prettier } from './types';
const bundledPrettier = require('prettier') as Prettier;

/**
 * Prettier reads configuration from files
 */
const prettierConfigFiles = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.yaml',
  '.prettierrc.yml',
  '.prettierrc.js',
  'package.json',
  'prettier.config.js'
];

/**
 * Create a file watcher. Clears prettier's configuration cache on file change, create, delete.
 * @returns disposable file system watcher.
 */
export function configFileListener() {
  const fileWatcher = workspace.createFileSystemWatcher(`**/{${prettierConfigFiles.join(',')}}`);
  fileWatcher.onDidChange(bundledPrettier.clearConfigCache);
  fileWatcher.onDidCreate(bundledPrettier.clearConfigCache);
  fileWatcher.onDidDelete(bundledPrettier.clearConfigCache);
  return fileWatcher;
}
