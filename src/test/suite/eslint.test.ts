import * as assert from "assert";
import { platform } from "os";
import {
  format,
  getText,
  moveRootPrettierRC,
  putBackPrettierRC,
} from "./format.test";

suite("Test eslint", function () {
  this.timeout(10000);
  this.beforeAll(moveRootPrettierRC);
  this.afterAll(putBackPrettierRC);
  test("it formats with prettier-eslint", async () => {
    if (platform() === "win32") {
      return assert.ok(true, "Skipping test on windows.");
    }
    const { actual } = await format("eslint", "index.js");
    const expected = await getText("eslint", "index.result.js");
    return assert.equal(actual, expected);
  });
});
