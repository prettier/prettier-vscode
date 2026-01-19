import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test plugins", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats with plugins", async () => {
    const { actual } = await format("plugins", "index.php");
    const expected = await getText("plugins", "index.result.php");
    assert.equal(actual, expected);
  });

  it("it correctly resolved plugin in pnpm node_modules dirs structure", async () => {
    const { actual } = await format("plugins-pnpm", "index.js");
    const expected = await getText("plugins-pnpm", "index.result.js");
    assert.equal(actual, expected);
  });

  it("it should be able to obtain the `inferredParser` of the plugin", async () => {
    const { actual } = await format("plugins-pnpm", "index.php");
    const expected = await getText("plugins-pnpm", "index.result.php");
    assert.equal(actual, expected);
  });

  it("it formats consistently with @ianvs/prettier-plugin-sort-imports", async () => {
    const { actual: firstFormat } = await format(
      "sort-imports-plugin",
      "index.tsx",
    );
    const expected = await getText("sort-imports-plugin", "index.result.tsx");
    assert.equal(
      firstFormat,
      expected,
      "First format should match expected output",
    );

    // Format again to ensure it's idempotent (doesn't toggle)
    const { actual: secondFormat } = await format(
      "sort-imports-plugin",
      "index.tsx",
    );
    assert.equal(
      secondFormat,
      expected,
      "Second format should match expected output (not toggle)",
    );

    // Format a third time to triple-check consistency
    const { actual: thirdFormat } = await format(
      "sort-imports-plugin",
      "index.tsx",
    );
    assert.equal(
      thirdFormat,
      expected,
      "Third format should match expected output (still consistent)",
    );
  });
});
