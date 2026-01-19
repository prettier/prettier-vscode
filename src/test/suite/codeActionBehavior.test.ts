import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";
import { getWorkspaceFolderUri } from "./formatTestUtils.js";
import * as path from "path";

/**
 * Tests for code action behavior respecting VS Code settings
 */
describe("Code Action Provider Behavior", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("should provide code action when explicitly requesting source.fixAll.prettier", async () => {
    const workspaceUri = getWorkspaceFolderUri("project");
    const testFile = path.join(workspaceUri.fsPath, "formatTest/ugly.js");

    // Open the document
    const doc = await vscode.workspace.openTextDocument(testFile);

    // Show the document in editor
    await vscode.window.showTextDocument(doc);

    // Request the code action explicitly
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      doc.uri,
      new vscode.Range(0, 0, doc.lineCount, 0),
      vscode.CodeActionKind.SourceFixAll.append("prettier").value,
    );

    assert.ok(
      codeActions && codeActions.length > 0,
      "Should provide code action when source.fixAll.prettier is explicitly requested",
    );

    // Close without saving
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  it("should provide code action when Prettier is the default formatter (wildcard request)", async () => {
    const workspaceUri = getWorkspaceFolderUri("project");
    const testFile = path.join(workspaceUri.fsPath, "formatTest/ugly.js");

    // Open the document
    const doc = await vscode.workspace.openTextDocument(testFile);

    // Ensure Prettier is the default formatter (should be set in test.code-workspace)
    const config = vscode.workspace.getConfiguration("editor", doc.uri);
    const defaultFormatter = config.get<string>("defaultFormatter");
    assert.strictEqual(
      defaultFormatter,
      "esbenp.prettier-vscode",
      "Test assumes Prettier is the default formatter",
    );

    // Show the document in editor
    await vscode.window.showTextDocument(doc);

    // Request wildcard code actions (source.fixAll)
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      doc.uri,
      new vscode.Range(0, 0, doc.lineCount, 0),
      vscode.CodeActionKind.SourceFixAll.value,
    );

    // Should provide code action when Prettier is the default formatter
    const prettierAction = codeActions?.find((action) =>
      action.kind?.value.includes("prettier"),
    );
    assert.ok(
      prettierAction,
      "Should provide code action when Prettier is default formatter and source.fixAll is requested",
    );

    // Close without saving
    await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  });

  it("should NOT provide code action when a different formatter is set as default (wildcard request)", async () => {
    const workspaceUri = getWorkspaceFolderUri("project");
    const testFile = path.join(workspaceUri.fsPath, "formatTest/ugly.js");

    // Open the document
    const doc = await vscode.workspace.openTextDocument(testFile);

    // Set a different default formatter
    const config = vscode.workspace.getConfiguration("editor", doc.uri);
    await config.update(
      "defaultFormatter",
      "vscode.typescript-language-features",
      vscode.ConfigurationTarget.WorkspaceFolder,
    );

    try {
      // Show the document in editor
      await vscode.window.showTextDocument(doc);

      // Request wildcard code actions (source.fixAll)
      const codeActions = await vscode.commands.executeCommand<
        vscode.CodeAction[]
      >(
        "vscode.executeCodeActionProvider",
        doc.uri,
        new vscode.Range(0, 0, doc.lineCount, 0),
        vscode.CodeActionKind.SourceFixAll.value,
      );

      // Should NOT provide Prettier code action when different formatter is default
      const prettierAction = codeActions?.find((action) =>
        action.kind?.value.includes("prettier"),
      );
      assert.strictEqual(
        prettierAction,
        undefined,
        "Should NOT provide code action when different formatter is default and only wildcard source.fixAll is requested",
      );
    } finally {
      // Clean up - restore setting
      await config.update(
        "defaultFormatter",
        undefined,
        vscode.ConfigurationTarget.WorkspaceFolder,
      );
      // Close without saving
      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor",
      );
    }
  });

  it("should provide code action even when different formatter is default but source.fixAll.prettier is explicit", async () => {
    const workspaceUri = getWorkspaceFolderUri("project");
    const testFile = path.join(workspaceUri.fsPath, "formatTest/ugly.js");

    // Open the document
    const doc = await vscode.workspace.openTextDocument(testFile);

    // Set a different default formatter
    const config = vscode.workspace.getConfiguration("editor", doc.uri);
    await config.update(
      "defaultFormatter",
      "vscode.typescript-language-features",
      vscode.ConfigurationTarget.WorkspaceFolder,
    );

    try {
      // Show the document in editor
      await vscode.window.showTextDocument(doc);

      // Request source.fixAll.prettier explicitly (not wildcard)
      const codeActions = await vscode.commands.executeCommand<
        vscode.CodeAction[]
      >(
        "vscode.executeCodeActionProvider",
        doc.uri,
        new vscode.Range(0, 0, doc.lineCount, 0),
        vscode.CodeActionKind.SourceFixAll.append("prettier").value,
      );

      // Should provide code action when explicitly requested, even with different default formatter
      assert.ok(
        codeActions && codeActions.length > 0,
        "Should provide code action when source.fixAll.prettier is explicitly requested, regardless of default formatter",
      );
    } finally {
      // Clean up - restore setting
      await config.update(
        "defaultFormatter",
        undefined,
        vscode.ConfigurationTarget.WorkspaceFolder,
      );
      // Close without saving
      await vscode.commands.executeCommand(
        "workbench.action.closeActiveEditor",
      );
    }
  });
});
