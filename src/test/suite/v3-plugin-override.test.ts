import * as assert from "assert";
import { format, getText } from "./format.test";

suite("Test v3 + plugin override", function () {
  this.timeout(20000);
  test("it formats with v3 + plugin override", async () => {
    const { actual } = await format(
      "v3-plugin-override",
      "index.js",
      /* shouldRetry */ true
    );
    const expected = await getText("v3-plugin-override", "index.result.js");
    assert.equal(actual, expected);
    assert.equal(actual, "fake format\n");
  });
});
