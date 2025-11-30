import * as assert from "node:assert";
import { format, getText } from "./format.test";

/**
 * Test for GitHub issue https://github.com/prettier/prettier/issues/18353
 *
 * This tests that when a monorepo subfolder has its own Prettier installation
 * and plugins, the plugin resolution works correctly. In Prettier 3.7.0+,
 * there was a regression where plugins would be resolved from the wrong
 * directory, causing errors like:
 *
 * "Cannot find package 'prettier-plugin-xxx' imported from /path/to/root/noop.js"
 */
describe("Test monorepo subfolder plugin resolution (issue #18353)", () => {
  // This test verifies the subfolder works when opened as its own workspace
  it("formats with plugins in a monorepo subfolder (opened directly)", async () => {
    const { actual } = await format(
      "subfolder",
      "index.xml",
      /* shouldRetry */ true,
    );
    const expected = await getText("subfolder", "index.result.xml");
    assert.equal(actual, expected);
  });

  // This test reproduces the actual issue - when the parent folder is opened
  // and we try to format a file in a nested subfolder that has its own Prettier
  it("formats with plugins when opened from parent folder", async () => {
    const { actual } = await format(
      "monorepo-subfolder",
      "subfolder/index.xml",
      /* shouldRetry */ true,
    );
    const expected = await getText(
      "monorepo-subfolder",
      "subfolder/index.result.xml",
    );
    assert.equal(actual, expected);
  });
});
