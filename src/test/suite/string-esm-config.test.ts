import * as assert from "assert";
import { format, getText } from "./formatTestUtils.js";
import { ensureExtensionActivated } from "./testUtils.js";

describe("String ESM Config Support", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  // This test validates that .prettierrc with a string reference to an ESM config package works
  // Reproduces issue where extension fails with "Invalid prettier configuration file detected"
  // when .prettierrc contains a string pointing to an ESM prettier config package
  it("it formats with .prettierrc containing string reference to ESM config package", async () => {
    const { actual } = await format("string-esm-config", "test.js");
    const expected = await getText("string-esm-config", "test.result.js");
    assert.equal(actual, expected);
  });
});
