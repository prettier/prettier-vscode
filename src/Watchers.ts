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

// Watch for package changes as it could be a prettier plugin which adds more languages
const packageWatcher = (listener: () => any) => {
  const watcher = workspace.createFileSystemWatcher("**/package.json");
  watcher.onDidChange(listener);
  watcher.onDidCreate(listener);
  watcher.onDidDelete(listener);
  return watcher;
};

// Watch for changes to prettier config files
const fileWatcher = (listener: () => any) => {
  const watcher = workspace.createFileSystemWatcher(
    `**/{${PRETTIER_CONFIG_FILES.join(",")}}`
  );
  watcher.onDidChange(listener);
  watcher.onDidCreate(listener);
  watcher.onDidDelete(listener);
  return watcher;
};

// Listen for changes that disable/enable languages
const configWatcher = (listener: () => any) =>
  workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration("prettier.disableLanguages")) {
      listener();
    }
  });

const workspaceFolderWatcher = (listener: () => any) =>
  workspace.onDidChangeWorkspaceFolders(listener);

export { packageWatcher, fileWatcher, configWatcher, workspaceFolderWatcher };
