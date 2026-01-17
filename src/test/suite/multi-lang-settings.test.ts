import * as assert from "assert";
import { ensureExtensionActivated } from "./testUtils.js";
import { format } from "./formatTestUtils.js";

describe("Test multi-language settings (e.g., [markdown][yaml])", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("formats markdown with combined language settings", async () => {
    const { actual, source } = await format(
      "multi-lang-settings",
      "ugly.md",
    );
    // Source has extra whitespace that should be removed
    assert.notEqual(actual, source, "Document should have been formatted");
    // Prettier normalizes markdown spacing
    assert.ok(
      actual.includes("# Test\n\ntest\n"),
      "Markdown should be formatted properly",
    );
  });

  it("formats yaml with combined language settings", async () => {
    const { actual, source } = await format(
      "multi-lang-settings",
      "ugly.yaml",
    );
    // Source has inconsistent spacing that should be fixed
    assert.notEqual(actual, source, "Document should have been formatted");
    // Prettier normalizes yaml spacing
    assert.ok(
      actual.includes("key: value\n"),
      "YAML should be formatted properly",
    );
  });
});
