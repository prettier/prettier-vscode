import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test Prettier Code Actions", () => {
  const unformattedCode = `const  x   =  {  a: 1, b: 2  }`;
  const expectedFormatted = `const x = { a: 1, b: 2 };\n`;

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
    assert.equal(
      formattedText,
      expectedFormatted,
      "Document should be formatted correctly after applying code action",
    );
  });
});
