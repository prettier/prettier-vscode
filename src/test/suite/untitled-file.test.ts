import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test untitled file formatting", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("formats untitled file with requireConfig enabled", async () => {
    // Create an untitled document
    const doc = await vscode.workspace.openTextDocument({
      content: "const   x=1",
      language: "javascript",
    });

    assert.strictEqual(
      doc.uri.scheme,
      "untitled",
      "Document should have untitled scheme",
    );

    // Show the document to enable formatting
    await vscode.window.showTextDocument(doc);

    // Get the Prettier configuration and enable requireConfig
    const config = vscode.workspace.getConfiguration("prettier");
    const originalRequireConfig = config.get("requireConfig");

    try {
      // Enable requireConfig
      await config.update(
        "requireConfig",
        true,
        vscode.ConfigurationTarget.Global,
      );

      // Wait for config to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Format the document
      const originalText = doc.getText();
      await vscode.commands.executeCommand("editor.action.formatDocument");

      // Get the formatted text
      const formattedText = doc.getText();

      // The document should be formatted even though requireConfig is true
      // because untitled files should use VS Code settings
      assert.notStrictEqual(
        formattedText,
        originalText,
        "Untitled document should be formatted even with requireConfig enabled",
      );

      // Verify the formatting is correct (spaces removed around =)
      assert.ok(
        formattedText.includes("const x = 1"),
        `Expected formatted code, got: ${formattedText}`,
      );
    } finally {
      // Restore original setting
      await config.update(
        "requireConfig",
        originalRequireConfig,
        vscode.ConfigurationTarget.Global,
      );

      // Close the untitled document without saving
      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor",
      );
    }
  });

  it("untitled file uses VS Code settings not workspace config", async () => {
    // Create an untitled document
    const doc = await vscode.workspace.openTextDocument({
      content: "const x = 1;",
      language: "javascript",
    });

    assert.strictEqual(doc.uri.scheme, "untitled");

    await vscode.window.showTextDocument(doc);

    const config = vscode.workspace.getConfiguration("prettier");
    const originalSemi = config.get("semi");

    try {
      // Set VS Code setting to remove semicolons
      await config.update("semi", false, vscode.ConfigurationTarget.Global);

      // Wait for config to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Format the document
      await vscode.commands.executeCommand("editor.action.formatDocument");

      const formattedText = doc.getText();

      // Should use VS Code's semi: false setting
      assert.ok(
        !formattedText.includes(";"),
        `Expected no semicolon with VS Code settings, got: ${formattedText}`,
      );
    } finally {
      // Restore original setting
      await config.update(
        "semi",
        originalSemi,
        vscode.ConfigurationTarget.Global,
      );
      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor",
      );
    }
  });
});
