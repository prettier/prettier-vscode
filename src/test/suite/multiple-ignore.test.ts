import * as assert from "assert";
import * as vscode from "vscode";
import { format } from "./format.test";

suite("Test multiple ignore paths", function () {
  this.timeout(10000);

  test("it does not format file ignored by first path", async () => {
    const config = vscode.workspace.getConfiguration("prettier");
    await config.update(
      "ignorePath",
      [".prettierignore", ".prettierignore2"],
      vscode.ConfigurationTarget.Workspace
    );

    const { actual, source } = await format(
      "multiple-ignore",
      "ignoredByFirst.js"
    );
    assert.equal(actual, source);

    // Reset config
    await config.update(
      "ignorePath",
      undefined,
      vscode.ConfigurationTarget.Workspace
    );
  });

  test("it does not format file ignored by second path", async () => {
    const config = vscode.workspace.getConfiguration("prettier");
    await config.update(
      "ignorePath",
      [".prettierignore", ".prettierignore2"],
      vscode.ConfigurationTarget.Workspace
    );

    const { actual, source } = await format(
      "multiple-ignore",
      "ignoredBySecond.js"
    );
    assert.equal(actual, source);

    // Reset config
    await config.update(
      "ignorePath",
      undefined,
      vscode.ConfigurationTarget.Workspace
    );
  });

  test("it formats file not ignored by either path", async () => {
    const config = vscode.workspace.getConfiguration("prettier");
    await config.update(
      "ignorePath",
      [".prettierignore", ".prettierignore2"],
      vscode.ConfigurationTarget.Workspace
    );

    const { actual, source } = await format("multiple-ignore", "notIgnored.js");
    assert.notEqual(actual, source);
    assert(actual.includes("const foo = { bar: 1, baz: 2 }"));

    // Reset config
    await config.update(
      "ignorePath",
      undefined,
      vscode.ConfigurationTarget.Workspace
    );
  });
});
