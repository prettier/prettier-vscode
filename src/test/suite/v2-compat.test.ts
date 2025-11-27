import * as assert from "assert";
import { format, getText } from "./format.test";

suite("Prettier v2 Backward Compatibility", function () {
  this.timeout(10000);

  test("it formats with explicit Prettier v2 dependency", async () => {
    const { actual } = await format(
      "v2-explicit",
      "index.ts",
      /* shouldRetry */ true,
    );
    const expected = await getText("v2-explicit", "index.result.ts");
    assert.equal(actual, expected);
  });
});
