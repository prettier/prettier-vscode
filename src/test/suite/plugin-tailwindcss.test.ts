import * as assert from "assert";
import { format, getText } from "./format.test";

suite("Test plugin-tailwindcss", function () {
  this.timeout(10000);
  test("it formats with prettier-plugin-tailwindcss", async () => {
    const { actual } = await format(
      "plugin-tailwindcss",
      "index.js",
      /* shouldRetry */ true
    );
    const expected = await getText("plugin-tailwindcss", "index.result.js");
    assert.equal(actual, expected);
  });
});
