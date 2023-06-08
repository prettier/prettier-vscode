import * as os from "os";
import * as path from "path";
import * as fs from "fs";

import * as vscode from "vscode";

function getLogFilePath(): string {
  const isCI = "GITHUB_ACTIONS" in process.env;
  const logFilePath = path.join(isCI ? os.homedir() : process.cwd(), "log.txt");
  return logFilePath;
}

function getActiveWorkspaceFolderName(): string {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(
      activeEditor.document.uri
    );
    if (workspaceFolder) {
      const workspacePath = workspaceFolder.uri.fsPath;
      return path.basename(workspacePath);
    }
  }
  return "??";
}

export function log(from: string, value: string): void {
  const activeWorkspaceFolderName = getActiveWorkspaceFolderName();
  const fromPart = `[${activeWorkspaceFolderName} ${from}]\n`;
  const datePart = `  ${new Date().toString()}\n`;
  const valuePart = `  ${value}\n`;
  fs.appendFileSync(getLogFilePath(), fromPart + datePart + valuePart);
}
