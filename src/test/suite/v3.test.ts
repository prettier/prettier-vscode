import * as assert from "assert";
import { format, getText } from "./format.test";

suite("Tests for Prettier v3", function () {
  this.timeout(10000);
  test("it formats by Prettier v3", async () => {
    const { actual } = await format("v3", "index.js");
    const expected = await getText("v3", "index.result.js");
    assert.equal(actual, expected);
  });
});
