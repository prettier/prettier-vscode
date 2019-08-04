import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { Prettier } from '../../types';
import { Uri } from 'vscode';
const prettier = require('prettier') as Prettier;

/**
 * loads and format a file.
 * @param file path relative to base URI (a workspaceFolder's URI)
 * @param base base URI
 * @returns source code and resulting code
 */
export function format(
  file: string,
  base: Uri = vscode.workspace.workspaceFolders![0].uri
): Promise<{ result: string; source: string }> {
  const absPath = path.join(base.fsPath, file);
  return new Promise((resolve, reject) => {
    vscode.workspace.openTextDocument(absPath).then(doc => {
      const text = doc.getText();
      vscode.window.showTextDocument(doc).then(() => {
        console.time(file);
        vscode.commands.executeCommand('editor.action.formatDocument').then(() => {
          console.timeEnd(file);
          resolve({ result: doc.getText(), source: text });
        }, reject);
      }, reject);
    }, reject);
  });
}
/**
 * Compare prettier's output (default settings)
 * with the output from extension.
 * @param file path relative to workspace root
 */
function formatSameAsPrettier(file: string) {
  return format(file).then(result => {
    const prettierFormatted = prettier.format(result.source, {
      filepath: file
    });
    assert.strictEqual(result.result, prettierFormatted);
  });
}

suite('Test format Document', () => {
  test('it formats JavaScript', () => formatSameAsPrettier('formatTest/ugly.js'));
  test('it formats TypeScript', () => formatSameAsPrettier('formatTest/ugly.ts'));
  test('it formats CSS', () => formatSameAsPrettier('formatTest/ugly.css'));
  test('it formats JSON', () => formatSameAsPrettier('formatTest/ugly.json'));
  test('it formats JSON', () => formatSameAsPrettier('formatTest/package.json'));
  test('it formats HTML', () => formatSameAsPrettier('formatTest/index.html'));
  // one would need to register that language for it to work ...
  // test('it formats GraphQL', () => {
  //     return;
  // });
});
