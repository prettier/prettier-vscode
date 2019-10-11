import * as assert from 'assert';
import * as path from 'path';
import * as prettier from 'prettier';
// tslint:disable-next-line: no-implicit-dependencies
import * as vscode from 'vscode';

/**
 * gets the workspace folder by name
 * @param name Workspace folder name
 */
const getWorkspaceFolderUri = (workspaceFolderName: string) => {
  const workspaceFolder = vscode.workspace.workspaceFolders!.find(folder => {
    return folder.name === workspaceFolderName;
  });
  return workspaceFolder!.uri;
};

/**
 * loads and format a file.
 * @param file path relative to base URI (a workspaceFolder's URI)
 * @param base base URI
 * @returns source code and resulting code
 */
export async function format(workspaceFolderName: string, file: string) {
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const absPath = path.join(base.fsPath, file);
  const doc = await vscode.workspace.openTextDocument(absPath);
  const text = doc.getText();
  try {
    await vscode.window.showTextDocument(doc);
  } catch (err) {
    // tslint:disable-next-line: no-console
    console.log(err);
    throw err;
  }
  // tslint:disable-next-line: no-console
  console.time(file);
  return vscode.commands
    .executeCommand('editor.action.formatDocument')
    .then(() => {
      // tslint:disable-next-line: no-console
      console.timeEnd(file);
      return { result: doc.getText(), source: text };
    });
}
/**
 * Compare prettier's output (default settings)
 * with the output from extension.
 * @param file path relative to workspace root
 */
async function formatSameAsPrettier(file: string) {
  const { result, source } = await format('project', file);
  const prettierFormatted = prettier.format(source, {
    filepath: file
  });
  assert.equal(result, prettierFormatted);
}

suite('Test format Document', function() {
  this.timeout(10000);
  test('it formats JavaScript', () =>
    formatSameAsPrettier('formatTest/ugly.js'));
  test('it formats TypeScript', () =>
    formatSameAsPrettier('formatTest/ugly.ts'));
  test('it formats CSS', () => formatSameAsPrettier('formatTest/ugly.css'));
  test('it formats JSON', () => formatSameAsPrettier('formatTest/ugly.json'));
  test('it formats JSON', () =>
    formatSameAsPrettier('formatTest/package.json'));
  test('it formats HTML', () => formatSameAsPrettier('formatTest/ugly.html'));
  test('it formats TSX', () => formatSameAsPrettier('formatTest/ugly.tsx'));
  test('it formats SCSS', () => formatSameAsPrettier('formatTest/ugly.scss'));
});
