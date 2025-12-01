import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("Test plugin-tailwindcss", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("it formats with prettier-plugin-tailwindcss", async () => {
    const { actual } = await format("plugin-tailwindcss", "index.js");
    const expected = await getText("plugin-tailwindcss", "index.result.js");
    assert.equal(actual, expected);
  });
});
