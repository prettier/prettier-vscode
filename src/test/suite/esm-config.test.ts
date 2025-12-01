import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("ESM Config File Support", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  // This test validates Issue #3298 - ESM config without local prettier
  // Should use bundled Prettier (v3 after upgrade) to read ESM config
  it("it formats with ESM prettier.config.js (no local prettier)", async () => {
    const { actual } = await format("esm-config", "index.js");
    const expected = await getText("esm-config", "index.result.js");
    assert.equal(actual, expected);
  });
});
