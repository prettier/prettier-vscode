import * as assert from "assert";
import { platform } from "os";
import { format, getText } from "./format.test";

suite("Test module resolution", function () {
  this.timeout(10000);

  test("it formats without prettier in package.json", async () => {
    if (platform() === "win32") {
      return assert.ok(true, "Skipping test on windows.");
    }
    const { actual } = await format("module", "index.js");
    const expected = await getText("module", "index.result.js");
    assert.equal(actual, expected);
  });

  test("it loads plugin referenced in dependency module", async () => {
    if (platform() === "win32") {
      return assert.ok(true, "Skipping test on windows.");
    }
    const { actual } = await format("module-plugin", "index.js");
    const expected = await getText("module-plugin", "index.result.js");
    assert.equal(actual, expected);
  });
});
