import * as assert from "node:assert";
import { readFile, rename } from "node:fs";
import * as path from "node:path";
import * as prettier from "prettier";
import { promisify } from "node:util";
import * as vscode from "vscode";

const readFileAsync: (filePath: string, encoding: "utf8") => Promise<string> =
  promisify(readFile);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  return workspaceFolder!.uri;
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
 * loads and format a file.
 * @param testFile path relative to base URI (a workspaceFolder's URI)
 * @param base base URI
 * @returns source code and resulting code
 */
export async function format(
  workspaceFolderName: string,
  testFile: string,
  shouldRetry = false,
) {
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
  await vscode.commands.executeCommand("editor.action.formatDocument");

  let actual = doc.getText();

  if (shouldRetry) {
    for (let i = 0; i < 10; i++) {
      if (text !== actual) {
        break;
      }
      await wait(250);
      await vscode.commands.executeCommand("editor.action.formatDocument");
      actual = doc.getText();
    }
  }

  console.timeEnd(testFile);

  return { actual, source: text };
}
/**
 * Compare prettier's output (default settings)
 * with the output from extension.
 * @param file path relative to workspace root
 */
async function formatSameAsPrettier(
  file: string,
  options?: Partial<prettier.Options>,
) {
  const prettierOptions: prettier.Options = {
    ...options,
    ...{
      /* cspell: disable-next-line */
      filepath: file,
    },
  };
  const { actual, source } = await format("project", file);
  const prettierFormatted = await prettier.format(source, prettierOptions);
  assert.equal(actual, prettierFormatted);
}

describe("Test format Document", () => {
  it("formats JavaScript", async () => {
    // Wait for extension to initialize and retry if needed
    await wait(1000);
    const { actual, source } = await format(
      "project",
      "formatTest/ugly.js",
      true,
    );
    const prettierFormatted = await prettier.format(source, {
      filepath: "formatTest/ugly.js",
    });
    assert.equal(actual, prettierFormatted);
  });
  it("formats TypeScript", () => formatSameAsPrettier("formatTest/ugly.ts"));
  it("formats CSS", () => formatSameAsPrettier("formatTest/ugly.css"));
  it("formats JSON", () => formatSameAsPrettier("formatTest/ugly.json"));
  it("formats JSONC", () => formatSameAsPrettier("formatTest/ugly.jsonc"));
  it("formats JSON", () => formatSameAsPrettier("formatTest/package.json"));
  it("formats HTML", () => formatSameAsPrettier("formatTest/ugly.html"));
  it("formats LWC", () =>
    formatSameAsPrettier("formatTest/lwc.html", { parser: "lwc" }));
  it("formats TSX", () => formatSameAsPrettier("formatTest/ugly.tsx"));
  it("formats SCSS", () => formatSameAsPrettier("formatTest/ugly.scss"));
  it("formats GraphQL", () => formatSameAsPrettier("formatTest/ugly.graphql"));
  it("formats HTML with literals", () =>
    formatSameAsPrettier("formatTest/htmlWithLiterals.html"));
  it("formats Vue", () => formatSameAsPrettier("formatTest/ugly.vue"));
  it("formats HBS", () => formatSameAsPrettier("formatTest/ugly.hbs"));
});
