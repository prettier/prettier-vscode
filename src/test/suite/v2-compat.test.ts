import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Prettier v2 Backward Compatibility", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats with explicit Prettier v2 dependency", async () => {
    const { actual } = await format("v2-explicit", "index.ts");
    const expected = await getText("v2-explicit", "index.result.ts");
    assert.equal(actual, expected);
  });
});
