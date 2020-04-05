import * as assert from "assert";
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
    const { actual } = await format("eslint", "index.js");
    const expected = await getText("eslint", "index.result.js");
    return assert.equal(actual, expected);
  });
});
