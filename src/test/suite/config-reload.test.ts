import * as assert from "node:assert";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { format, getText, getWorkspaceFolderUri } from "./format.test";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Test config reload with Prettier v3", () => {
  it("should reload prettier.config.js changes without restart", async function () {
    // Increase timeout for this test as it involves file watching
    this.timeout(10000);

    const workspaceFolderName = "v3-config-reload";
    const base = getWorkspaceFolderUri(workspaceFolderName);
    const configPath = path.join(base.fsPath, "prettier.config.js");

    // Read original config
    const originalConfig = await fs.readFile(configPath, "utf8");

    try {
      // Format with initial config (tabWidth: 2, semi: true)
      const { actual: firstFormat } = await format(
        workspaceFolderName,
        "test.js",
      );
      const expectedFirst = await getText(workspaceFolderName, "test.result.js");
      assert.equal(firstFormat, expectedFirst);

      // Update config to tabWidth: 4, semi: false
      await fs.writeFile(
        configPath,
        `module.exports = {
  tabWidth: 4,
  semi: false,
};
`,
        "utf8",
      );

      // Wait a bit for file watcher to pick up the change
      await wait(500);

      // Format again - should use new config
      const { actual: secondFormat } = await format(
        workspaceFolderName,
        "test.js",
      );

      // With tabWidth: 4 and semi: false, the result should be:
      // const test = "hello"\n (no semicolon)
      const expectedSecond = 'const test = "hello"\n';
      assert.equal(secondFormat, expectedSecond);
    } finally {
      // Restore original config
      await fs.writeFile(configPath, originalConfig, "utf8");
      // Wait a bit for file watcher to pick up the restoration
      await wait(500);
    }
  });
});
