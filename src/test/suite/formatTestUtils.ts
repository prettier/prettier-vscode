import { readFile, rename } from "fs";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

const readFileAsync: (filePath: string, encoding: "utf8") => Promise<string> =
  promisify(readFile);

/**
 * gets the workspace folder by name
 * @param name Workspace folder name
 */
export const getWorkspaceFolderUri = (workspaceFolderName: string) => {
  const workspaceFolder = vscode.workspace.workspaceFolders!.find((folder) => {
    return folder.name === workspaceFolderName;
  });
  if (!workspaceFolder) {
    throw new Error(
      "Folder not found in workspace. Did you forget to add the test folder to test.code-workspace?",
    );
  }
  return workspaceFolder.uri;
};

export async function getText(
  workspaceFolderName: string,
  expectedFile: string,
) {
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const expectedPath = path.join(base.fsPath, expectedFile);
  const expected = await readFileAsync(expectedPath, "utf8");
  return expected;
}

const prettierConfigOrig = path.resolve(__dirname, "../../../.prettierrc");
const prettierConfigTemp = path.resolve(__dirname, "../../../old.prettierrc");

export function moveRootPrettierRC(): Promise<void> {
  return new Promise((resolve, reject) => {
    rename(prettierConfigOrig, prettierConfigTemp, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function putBackPrettierRC(): Promise<void> {
  return new Promise((resolve, reject) => {
    rename(prettierConfigTemp, prettierConfigOrig, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Helper to wait for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * loads and format a file.
 * @param testFile path relative to base URI (a workspaceFolder's URI)
 * @param base base URI
 * @returns source code and resulting code
 */
export async function format(workspaceFolderName: string, testFile: string) {
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const absPath = path.join(base.fsPath, testFile);
  const doc = await vscode.workspace.openTextDocument(absPath);
  const text = doc.getText();
  try {
    await vscode.window.showTextDocument(doc);
  } catch (error) {
    console.log(error);
    throw error;
  }
  console.time(testFile);

  // Retry logic for workspace-based formatting
  // Local Prettier instances are resolved lazily, so the first format attempt
  // may not work while the module is being loaded
  const maxRetries = 5;
  const retryDelay = 500;
  let actual = text;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await vscode.commands.executeCommand("editor.action.formatDocument");
    actual = doc.getText();

    if (actual !== text) {
      // Document was formatted successfully
      break;
    }

    if (attempt < maxRetries) {
      console.log(
        `Format attempt ${attempt} did not change document, retrying in ${retryDelay}ms...`,
      );
      await delay(retryDelay);
    }
  }

  console.timeEnd(testFile);

  return { actual, source: text };
}
