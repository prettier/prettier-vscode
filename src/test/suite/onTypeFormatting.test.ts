import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";

// Helper to wait for formatting to complete
const FORMATTING_TIMEOUT_MS = 500;
async function waitForFormatting(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FORMATTING_TIMEOUT_MS));
}

describe("Test On-Type Formatting", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("formats JavaScript on semicolon", async () => {
    const input = `let x    =    1`;
    const expected = `let x = 1;\n`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Move cursor to the end and type semicolon
    const endPosition = doc.lineAt(0).range.end;
    editor.selection = new vscode.Selection(endPosition, endPosition);

    // Type semicolon to trigger on-type formatting
    await vscode.commands.executeCommand("type", { text: ";" });

    // Wait a bit for formatting to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    const output = doc.getText();
    assert.equal(output, expected);
  });

  it("formats JavaScript on closing brace", async () => {
    const input = `function foo()   {
    let x    =    1`;
    const expected = `function foo() {\n  let x = 1;\n}\n`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Move cursor to the end and type closing brace
    const endPosition = new vscode.Position(1, doc.lineAt(1).text.length);
    editor.selection = new vscode.Selection(endPosition, endPosition);

    // Type closing brace to trigger on-type formatting
    await vscode.commands.executeCommand("type", { text: "}" });

    // Wait for formatting to complete
    await waitForFormatting();

    const output = doc.getText();
    assert.equal(output, expected);
  });

  it("formats TypeScript on semicolon", async () => {
    const input = `const greeting:   string   =   "hello"`;
    const expected = `const greeting: string = "hello";\n`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "typescript",
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Move cursor to the end and type semicolon
    const endPosition = doc.lineAt(0).range.end;
    editor.selection = new vscode.Selection(endPosition, endPosition);

    // Type semicolon to trigger on-type formatting
    await vscode.commands.executeCommand("type", { text: ";" });

    // Wait for formatting to complete
    await waitForFormatting();

    const output = doc.getText();
    assert.equal(output, expected);
  });

  it("does not format when typing in the middle of a line", async () => {
    const input = `let x = 1; let y = 2`;
    // When typing in the middle, the semicolon is inserted but no formatting occurs
    const expectedAfterTyping = `let x = 1;; let y = 2`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "javascript",
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Move cursor to the middle of the line (after first semicolon)
    const midPosition = new vscode.Position(0, 10);
    editor.selection = new vscode.Selection(midPosition, midPosition);

    // Type semicolon in the middle
    await vscode.commands.executeCommand("type", { text: ";" });

    // Wait for potential formatting
    await waitForFormatting();

    const output = doc.getText();
    // Should not have formatted because we're in the middle of the line
    assert.equal(output, expectedAfterTyping);
  });

  it("formats CSS on semicolon", async () => {
    const input = `.test   {   color:    red`;
    const expected = `.test {\n  color: red;\n}\n`;

    const doc = await vscode.workspace.openTextDocument({
      content: input,
      language: "css",
    });

    const editor = await vscode.window.showTextDocument(doc);

    // Move cursor to the end and type semicolon
    const endPosition = doc.lineAt(0).range.end;
    editor.selection = new vscode.Selection(endPosition, endPosition);

    // Type semicolon to trigger on-type formatting
    await vscode.commands.executeCommand("type", { text: ";" });

    // Wait for formatting to complete
    await waitForFormatting();

    // Type closing brace
    const newEndPosition = new vscode.Position(
      doc.lineCount - 1,
      doc.lineAt(doc.lineCount - 1).text.length,
    );
    editor.selection = new vscode.Selection(newEndPosition, newEndPosition);
    await vscode.commands.executeCommand("type", { text: "}" });

    // Wait for formatting to complete
    await waitForFormatting();

    const output = doc.getText();
    assert.equal(output, expected);
  });
});
