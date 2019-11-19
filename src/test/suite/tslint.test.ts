import * as assert from "assert";
import { platform } from "os";
import {
  format,
  getText,
  moveRootPrettierRC,
  putBackPrettierRC
} from "./format.test";

suite("Test tslint", function() {
  this.timeout(60000);
  this.beforeAll(moveRootPrettierRC);
  this.afterAll(putBackPrettierRC);
  test("it formats with prettier-tslint", async () => {
    if (platform() === "win32") {
      return assert.ok(true, "Skipping test on windows.");
    }
    const { actual } = await format("tslint", "index.ts");
    const expected = await getText("tslint", "index.result.ts");
    assert.equal(actual, expected);
  });
});
