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
export async function format(
    file: string,
    base: Uri = vscode.workspace.workspaceFolders![0].uri
) {
    const absPath = path.join(base.fsPath, file);
    const doc = await vscode.workspace.openTextDocument(absPath);
    const text = doc.getText();
    try {
        await vscode.window.showTextDocument(doc);
    } catch (err) {
        console.log(err);
        throw err;
    }
    console.time(file);
    return vscode.commands
        .executeCommand('editor.action.formatDocument')
        .then(() => {
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
    const { result, source } = await format(file);
    const prettierFormatted = prettier.format(source, {
        filepath: file,
    });
    assert.equal(result, prettierFormatted);
}

suite('Test format Document', () => {
    test('it formats JavaScript', () =>
        formatSameAsPrettier('formatTest/ugly.js'));
    test('it formats TypeScript', () =>
        formatSameAsPrettier('formatTest/ugly.ts'));
    test('it formats CSS', () => formatSameAsPrettier('formatTest/ugly.css'));
    test('it formats JSON', () => formatSameAsPrettier('formatTest/ugly.json'));
    test('it formats JSON', () =>
        formatSameAsPrettier('formatTest/package.json'));
    test('it formats HTML', () =>
        formatSameAsPrettier('formatTest/index.html'));
    // one would need to register that language for it to work ...
    // test('it formats GraphQL', () => {
    //     return;
    // });
});
