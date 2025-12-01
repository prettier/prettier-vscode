import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Tests for Prettier v3", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats by Prettier v3", async () => {
    const { actual } = await format("v3", "index.ts");
    const expected = await getText("v3", "index.result.ts");
    assert.equal(actual, expected);
  });
});
