import * as os from "os";
import * as path from "path";
import { Uri, workspace } from "vscode";
import { PrettierVSCodeConfig } from "./types";

export function getWorkspaceRelativePath(
  filePath: string,
  pathToResolve: string
) {
  // In case the user wants to use ~/.prettierrc on Mac
  if (
    process.platform === "darwin" &&
    pathToResolve.indexOf("~") === 0 &&
    os.homedir()
  ) {
    return pathToResolve.replace(/^~(?=$|\/|\\)/, os.homedir());
  }

  if (workspace.workspaceFolders) {
    const folder = workspace.getWorkspaceFolder(Uri.file(filePath));
    return folder
      ? path.isAbsolute(pathToResolve)
        ? pathToResolve
        : path.join(folder.uri.fsPath, pathToResolve)
      : undefined;
  }
}

export function getConfig(uri?: Uri): PrettierVSCodeConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return workspace.getConfiguration("prettier", uri) as any;
}

export function getIgnorePath(filePath: string): string | undefined {
  const { ignorePath } = getConfig(Uri.file(filePath));
  // Configuration `prettier.ignorePath` is set to `null`
  if (!ignorePath) {
    return;
  }
  return getWorkspaceRelativePath(filePath, ignorePath);
}
