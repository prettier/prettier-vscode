import * as assert from "assert";
import * as vscode from "vscode";
import { format, getWorkspaceFolderUri } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";
import * as path from "path";

describe("Test Prettier Code Actions", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("provides source.fixAll.prettier code action", async () => {
    const base = getWorkspaceFolderUri("project");
    const testFile = "formatTest/ugly.js";
    const absPath = path.join(base.fsPath, testFile);
    const doc = await vscode.workspace.openTextDocument(absPath);
    await vscode.window.showTextDocument(doc);

    // Get code actions for the document
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      doc.uri,
      new vscode.Range(0, 0, doc.lineCount, 0),
    );

    // Find the Prettier code action
    const prettierAction = codeActions?.find(
      (action) => action.kind?.value === "source.fixAll.prettier",
    );

    assert.ok(prettierAction, "Prettier code action should be available");
    assert.equal(
      prettierAction?.title,
      "Format with Prettier",
      "Code action should have correct title",
    );
  });

  it("formats document using code action", async () => {
    const base = getWorkspaceFolderUri("project");
    const testFile = "formatTest/ugly.js";
    const absPath = path.join(base.fsPath, testFile);
    const doc = await vscode.workspace.openTextDocument(absPath);
    const originalText = doc.getText();
    await vscode.window.showTextDocument(doc);

    // Get code actions for the document
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      doc.uri,
      new vscode.Range(0, 0, doc.lineCount, 0),
    );

    // Find and apply the Prettier code action
    const prettierAction = codeActions?.find(
      (action) => action.kind?.value === "source.fixAll.prettier",
    );

    assert.ok(prettierAction, "Prettier code action should be available");

    // Apply the code action
    if (prettierAction?.edit) {
      await vscode.workspace.applyEdit(prettierAction.edit);
    }

    const formattedText = doc.getText();

    // Verify the document was formatted
    assert.notEqual(
      formattedText,
      originalText,
      "Document should be formatted after applying code action",
    );

    // Compare with regular formatting to ensure consistency
    const { actual } = await format("project", testFile);
    assert.equal(
      formattedText,
      actual,
      "Code action formatting should match regular formatting",
    );
  });
});
