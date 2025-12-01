import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test ESM plugin import config", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats with ESM config using plugin import statements", async () => {
    const { actual } = await format("esm-plugin-import", "index.ts");
    const expected = await getText("esm-plugin-import", "index.result.ts");
    assert.equal(actual, expected);
  });
});
