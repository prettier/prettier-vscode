import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";

/**
 * Tests for untitled documents (unsaved files)
 * 
 * Untitled documents should NOT use workspace configuration.
 * They should only use the user's global/personal VS Code settings.
 */
describe("Test untitled documents", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("formats untitled JavaScript document using VS Code settings", async () => {
    // Create an untitled document with ugly JavaScript
    const uglyCode = 'const   x    =    1   ;   console.log(  x  )  ;';
    const doc = await vscode.workspace.openTextDocument({
      language: "javascript",
      content: uglyCode,
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Format the document
    await vscode.commands.executeCommand("editor.action.formatDocument");

    // The document should be formatted using VS Code settings (not workspace config)
    const formattedText = editor.document.getText();
    
    assert.notEqual(
      formattedText,
      uglyCode,
      "Untitled document should have been formatted using VS Code settings",
    );
    
    // Should not have excessive spacing
    assert.ok(
      !formattedText.includes("   "),
      "Formatted code should not have excessive spacing",
    );
  });

  it("formats untitled TypeScript document using VS Code settings", async () => {
    // Create an untitled document with ugly TypeScript
    const uglyCode = 'function   test (  a :  number  ) :  number {  return   a  *  2  ;  }';
    const doc = await vscode.workspace.openTextDocument({
      language: "typescript",
      content: uglyCode,
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Format the document
    await vscode.commands.executeCommand("editor.action.formatDocument");

    // The document should be formatted using VS Code settings (not workspace config)
    const formattedText = editor.document.getText();
    
    assert.notEqual(
      formattedText,
      uglyCode,
      "Untitled TypeScript document should have been formatted using VS Code settings",
    );
    
    // Should not have excessive spacing
    assert.ok(
      !formattedText.includes("   "),
      "Formatted code should not have excessive spacing",
    );
  });

  it("formats untitled document even when requireConfig is enabled in workspace", async () => {
    // This test verifies that untitled documents bypass the requireConfig check
    // Even if a workspace has prettier.requireConfig: true, untitled documents
    // should still be formatted using VS Code settings

    // Create an untitled document with code that needs formatting
    const uglyCode = 'const   foo    =    "bar"   ;';
    const doc = await vscode.workspace.openTextDocument({
      language: "javascript",
      content: uglyCode,
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Format the document
    await vscode.commands.executeCommand("editor.action.formatDocument");

    // The document should be formatted even though requireConfig may be enabled
    // This proves that untitled documents bypass the requireConfig check
    const formattedText = editor.document.getText();
    
    assert.notEqual(
      formattedText,
      uglyCode,
      "Untitled document should be formatted even with requireConfig enabled in workspace",
    );
    
    // Should not have excessive spacing
    assert.ok(
      !formattedText.includes("   "),
      "Formatted code should not have excessive spacing",
    );
  });
});
