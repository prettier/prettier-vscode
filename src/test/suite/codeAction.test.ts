import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";
import { getWorkspaceFolderUri } from "./formatTestUtils.js";

/**
 * Helper to wait for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Test Prettier Code Actions", () => {
  const unformattedCode = `const  x   =  {  a: 1, b: 2  }`;

  before(async () => {
    await ensureExtensionActivated();
  });

  it("provides source.fixAll.prettier code action", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: unformattedCode,
      language: "javascript",
    });
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
    const doc = await vscode.workspace.openTextDocument({
      content: unformattedCode,
      language: "javascript",
    });
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

    // Verify the document was formatted correctly
    // Normalize line endings for cross-platform compatibility
    const normalizedFormatted = formattedText.replace(/\r\n/g, "\n");
    const expectedNormalized = `const x = { a: 1, b: 2 };\n`;

    assert.equal(
      normalizedFormatted,
      expectedNormalized,
      "Document should be formatted correctly after applying code action",
    );
  });

  it("does NOT provide code action when defaultFormatter is not prettier", async function () {
    // Increase timeout for this test as it involves workspace folder switching
    this.timeout(10000);

    // The 'workspace' folder has editor.defaultFormatter set to
    // vscode.typescript-language-features for JavaScript files
    const base = getWorkspaceFolderUri("workspace");
    const testFilePath = vscode.Uri.joinPath(base, "test.js");
    const doc = await vscode.workspace.openTextDocument(testFilePath);
    await vscode.window.showTextDocument(doc);

    // Wait for formatter registration to complete
    await delay(1000);

    // Get code actions for the document
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      doc.uri,
      new vscode.Range(0, 0, doc.lineCount, 0),
    );

    // Prettier code action should NOT be available
    const prettierAction = codeActions?.find(
      (action) => action.kind?.value === "source.fixAll.prettier",
    );

    assert.ok(
      !prettierAction,
      "Prettier code action should NOT be available when defaultFormatter is not prettier",
    );
  });

  it("provides code action when source.fixAll.prettier is explicitly enabled", async function () {
    // Increase timeout for this test as it involves workspace folder switching
    this.timeout(10000);

    // The 'workspace-explicit-prettier' folder has:
    // - editor.defaultFormatter set to a different formatter
    // - BUT source.fixAll.prettier is explicitly set to "always"
    const base = getWorkspaceFolderUri("workspace-explicit-prettier");
    const testFilePath = vscode.Uri.joinPath(base, "test.js");
    const doc = await vscode.workspace.openTextDocument(testFilePath);
    await vscode.window.showTextDocument(doc);

    // Wait for formatter registration to complete
    await delay(1000);

    // Get code actions for the document
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      doc.uri,
      new vscode.Range(0, 0, doc.lineCount, 0),
    );

    // Prettier code action SHOULD be available because explicitly enabled
    const prettierAction = codeActions?.find(
      (action) => action.kind?.value === "source.fixAll.prettier",
    );

    assert.ok(
      prettierAction,
      "Prettier code action should be available when source.fixAll.prettier is explicitly enabled",
    );
  });
});
