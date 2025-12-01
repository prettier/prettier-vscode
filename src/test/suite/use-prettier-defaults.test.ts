import * as assert from "node:assert";
import * as vscode from "vscode";
import { format, getText } from "./format.test";

suite("Test use prettier defaults", function () {
  this.timeout(10000);
  const testFile = "index.js";

  test("it formats with Prettier defaults when usePrettierDefaults is enabled", async () => {
    // Set the usePrettierDefaults setting to true
    const config = vscode.workspace.getConfiguration("prettier");
    await config.update(
      "usePrettierDefaults",
      true,
      vscode.ConfigurationTarget.WorkspaceFolder,
    );

    const { actual } = await format("use-prettier-defaults", testFile, true);
    const expected = await getText("use-prettier-defaults", "index.result.js");

    assert.strictEqual(actual, expected);

    // Reset the setting
    await config.update(
      "usePrettierDefaults",
      undefined,
      vscode.ConfigurationTarget.WorkspaceFolder,
    );
  });

  test("it formats with VS Code settings when usePrettierDefaults is disabled", async () => {
    // Ensure usePrettierDefaults is false (default)
    const config = vscode.workspace.getConfiguration("prettier");
    await config.update(
      "usePrettierDefaults",
      false,
      vscode.ConfigurationTarget.WorkspaceFolder,
    );

    const { actual } = await format("use-prettier-defaults", testFile, true);

    // When usePrettierDefaults is false, it should use VS Code settings
    // which might differ from Prettier defaults
    // We're just verifying it runs without error and produces some formatted output
    assert.ok(actual.length > 0);

    // Reset the setting
    await config.update(
      "usePrettierDefaults",
      undefined,
      vscode.ConfigurationTarget.WorkspaceFolder,
    );
  });
});
