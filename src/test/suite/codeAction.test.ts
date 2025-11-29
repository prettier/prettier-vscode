import * as assert from "node:assert";
import * as path from "node:path";
import * as vscode from "vscode";
import { format, getWorkspaceFolderUri } from "./format.test";

suite("Code Action Test Suite", function () {
  this.timeout(60000);
  this.retries(3);

  test("Code action is registered", async () => {
    const workspaceFolderName = "project";
    const base = getWorkspaceFolderUri(workspaceFolderName);
    const testFile = "formatTest/ugly.ts";
    const absPath = path.join(base.fsPath, testFile);
    const doc = await vscode.workspace.openTextDocument(absPath);
    await vscode.window.showTextDocument(doc);

    // Request code actions with source.fixAll.prettier kind
    const codeActionKind =
      vscode.CodeActionKind.SourceFixAll.append("prettier");
    const codeActions = (await vscode.commands.executeCommand(
      "vscode.executeCodeActionProvider",
      doc.uri,
      doc.validateRange(new vscode.Range(0, 0, 0, 0)),
      codeActionKind.value,
    )) as vscode.CodeAction[];

    // Check that at least one code action is returned
    assert.ok(codeActions, "Code actions should be returned");
    assert.ok(codeActions.length > 0, "At least one code action should exist");

    // Verify the code action has the correct kind
    const prettierAction = codeActions.find((action) =>
      action.kind?.contains(codeActionKind),
    );
    assert.ok(prettierAction, "Prettier code action should be found");
    assert.ok(prettierAction.edit, "Prettier code action should have an edit");
  });

  test("Code action formats the document", async () => {
    const workspaceFolderName = "project";
    const base = getWorkspaceFolderUri(workspaceFolderName);
    const testFile = "formatTest/ugly.ts";
    const absPath = path.join(base.fsPath, testFile);
    const doc = await vscode.workspace.openTextDocument(absPath);
    const originalText = doc.getText();
    await vscode.window.showTextDocument(doc);

    // Request code actions with source.fixAll.prettier kind
    const codeActionKind =
      vscode.CodeActionKind.SourceFixAll.append("prettier");
    const codeActions = (await vscode.commands.executeCommand(
      "vscode.executeCodeActionProvider",
      doc.uri,
      doc.validateRange(new vscode.Range(0, 0, 0, 0)),
      codeActionKind.value,
    )) as vscode.CodeAction[];

    const prettierAction = codeActions.find((action) =>
      action.kind?.contains(codeActionKind),
    );
    assert.ok(prettierAction, "Prettier code action should be found");

    // Apply the code action
    if (prettierAction.edit) {
      await vscode.workspace.applyEdit(prettierAction.edit);
    }

    const formattedText = doc.getText();

    // Verify that the document has been formatted
    assert.notStrictEqual(
      formattedText,
      originalText,
      "Document should be formatted",
    );

    // Verify the result matches expected formatting
    const { actual } = await format(workspaceFolderName, testFile);
    assert.strictEqual(
      formattedText.trim(),
      actual.trim(),
      "Code action should produce same result as format command",
    );
  });
});
