import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test Prettier Code Actions", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("provides source.fixAll.prettier code action", async () => {
    const input = `const  x   =  {  a:1,b:2  }`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
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
    const input = `const  x   =  {  a:1,b:2  }`;
    const expected = `const x = { a: 1, b: 2 };\n`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
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
      expected,
      "Document should be formatted correctly after applying code action",
    );
  });
});
