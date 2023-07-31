import * as assert from "assert";
import { format, getText } from "./format.test";

suite("Test v3 + plugins", function () {
  this.timeout(10000);
  test("it formats with v3 + plugins", async () => {
    const { actual } = await format(
      "v3-plugins",
      "index.xml",
      /* shouldRetry */ true
    );
    const expected = await getText("v3-plugins", "index.result.xml");
    assert.equal(actual, expected);
  });
});
