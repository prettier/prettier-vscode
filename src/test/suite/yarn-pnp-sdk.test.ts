import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test Yarn PnP SDK with prettierPath pointing to .cjs file", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats with prettierPath pointing to a .cjs file", async () => {
    const { actual } = await format("yarn-pnp-sdk", "index.js");
    const expected = await getText("yarn-pnp-sdk", "index.result.js");
    assert.equal(actual, expected);
  });
});
