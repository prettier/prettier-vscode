import * as prettier from "prettier";
// tslint:disable-next-line: no-implicit-dependencies
import { workspace } from "vscode";

/**
 * Prettier reads configuration from files
 */
const PRETTIER_CONFIG_FILES = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yaml",
  ".prettierrc.yml",
  ".prettierrc.js",
  "package.json",
  "prettier.config.js"
];

/**
 * Create a file watcher. Clears prettier's configuration cache on
 * file change, create, delete.
 * @returns disposable file system watcher.
 */
function fileListener() {
  const fileWatcher = workspace.createFileSystemWatcher(
    `**/{${PRETTIER_CONFIG_FILES.join(",")}}`
  );
  fileWatcher.onDidChange(prettier.clearConfigCache);
  fileWatcher.onDidCreate(prettier.clearConfigCache);
  fileWatcher.onDidDelete(prettier.clearConfigCache);
  return fileWatcher;
}

export default fileListener;
