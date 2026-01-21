import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import {
  format,
  getWorkspaceFolderUri,
  moveRootPrettierRC,
  putBackPrettierRC,
} from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

/**
 * Helper to wait for a specified number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("Test config file watcher", () => {
  const configDir = "config-watcher";
  const configFile = ".prettierrc";
  let configPath: string;
  let originalConfig: string;

  before(async () => {
    await ensureExtensionActivated();
    await moveRootPrettierRC();

    // Store original config
    const base = getWorkspaceFolderUri("config");
    configPath = path.join(base.fsPath, configDir, configFile);
    originalConfig = await readFileAsync(configPath, "utf8");
  });

  after(async () => {
    // Restore original config
    await writeFileAsync(configPath, originalConfig, "utf8");
    await putBackPrettierRC();
  });

  it("detects config file changes and applies new formatting", async function () {
    // This test may need more time due to file watcher delays
    this.timeout(30000);

    // Format with initial config (tabWidth: 2)
    const { actual: initialFormat } = await format(
      "config",
      `${configDir}/test.js`,
    );

    // Verify initial format uses tabWidth: 2 (2-space indentation)
    assert.ok(
      initialFormat.includes("  console.log"),
      `Initial format should use 2-space indentation, got:\n${initialFormat}`,
    );

    // Change config to tabWidth: 4
    const newConfig = JSON.stringify({ tabWidth: 4 }, null, 2) + "\n";
    await writeFileAsync(configPath, newConfig, "utf8");

    // Wait for file watcher to detect the change
    // The watcher should clear the formatter cache
    await delay(2000);

    // Format again - should now use tabWidth: 4
    const { actual: newFormat } = await format(
      "config",
      `${configDir}/test.js`,
    );

    // Verify new format uses tabWidth: 4 (4-space indentation)
    assert.ok(
      newFormat.includes("    console.log"),
      `After config change, format should use 4-space indentation, got:\n${newFormat}`,
    );
    assert.ok(
      !newFormat.includes("  console.log(") ||
        newFormat.includes("    console.log"),
      "Should not have 2-space indentation after config change",
    );
  });
});
