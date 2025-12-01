import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test v3 + plugin override", function () {
  before(async () => {
    await ensureExtensionActivated();
  });

  this.timeout(20000);
  it("it formats with v3 + plugin override", async () => {
    const { actual } = await format("v3-plugin-override", "index.js");
    const expected = await getText("v3-plugin-override", "index.result.js");
    assert.equal(actual, expected);
    assert.equal(actual, "fake format\n");
  });
});
