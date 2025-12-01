import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test v3 + plugins", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats with v3 + plugins", async () => {
    const { actual } = await format(
      "v3-plugins",
      "index.xml",
    );
    const expected = await getText("v3-plugins", "index.result.xml");
    assert.equal(actual, expected);
  });
});
