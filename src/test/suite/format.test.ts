import * as assert from "assert";
import { readFile, rename } from "fs";
import { Done } from "mocha";
import * as path from "path";
import * as prettier from "prettier";
import { promisify } from "util";
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
      "Folder not found in workspace. Did you forget to add the test folder to test.code-workspace?"
    );
  }
  return workspaceFolder!.uri;
};

export async function getText(
  workspaceFolderName: string,
  expectedFile: string
) {
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const expectedPath = path.join(base.fsPath, expectedFile);
  const expected = await readFileAsync(expectedPath, "utf8");
  return expected;
}

const prettierConfigOrig = path.resolve(__dirname, "../../../.prettierrc");
const prettierConfigTemp = path.resolve(__dirname, "../../../old.prettierrc");

export function moveRootPrettierRC(done: Done) {
  rename(prettierConfigOrig, prettierConfigTemp, done);
}

export function putBackPrettierRC(done: Done) {
  rename(prettierConfigTemp, prettierConfigOrig, done);
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
    // eslint-disable-next-line no-console
    console.log(error);
    throw error;
  }
  // eslint-disable-next-line no-console
  console.time(testFile);
  await vscode.commands.executeCommand("editor.action.formatDocument");

  // eslint-disable-next-line no-console
  console.timeEnd(testFile);

  return { actual: doc.getText(), source: text };
}
/**
 * Compare prettier's output (default settings)
 * with the output from extension.
 * @param file path relative to workspace root
 */
async function formatSameAsPrettier(
  file: string,
  options?: Partial<prettier.Options>
) {
  const prettierOptions: prettier.Options = {
    ...options,
    ...{
      /* cspell: disable-next-line */
      filepath: file,
    },
  };
  const { actual, source } = await format("project", file);
  const prettierFormatted = prettier.format(source, prettierOptions);
  assert.equal(actual, prettierFormatted);
}

suite("Test format Document", function () {
  this.timeout(10000);
  test("it formats JavaScript", async () => {
    await wait(500);
    await formatSameAsPrettier("formatTest/ugly.js");
  });
  test("it formats TypeScript", () =>
    formatSameAsPrettier("formatTest/ugly.ts"));
  test("it formats CSS", () => formatSameAsPrettier("formatTest/ugly.css"));
  test("it formats JSON", () => formatSameAsPrettier("formatTest/ugly.json"));
  test("it formats JSONC", () =>
    formatSameAsPrettier("formatTest/ugly.jsonc", { parser: "json" }));
  test("it formats JSON", () =>
    formatSameAsPrettier("formatTest/package.json"));
  test("it formats HTML", () => formatSameAsPrettier("formatTest/ugly.html"));
  test("it formats LWC", () =>
    formatSameAsPrettier("formatTest/lwc.html", { parser: "lwc" }));
  test("it formats TSX", () => formatSameAsPrettier("formatTest/ugly.tsx"));
  test("it formats SCSS", () => formatSameAsPrettier("formatTest/ugly.scss"));
  test("it formats GraphQL", () =>
    formatSameAsPrettier("formatTest/ugly.graphql"));
  test("it formats HTML with literals", () =>
    formatSameAsPrettier("formatTest/htmlWithLiterals.html"));
  test("it formats Vue", () => formatSameAsPrettier("formatTest/ugly.vue"));
  test("it formats HBS", () => formatSameAsPrettier("formatTest/ugly.hbs"));
});
