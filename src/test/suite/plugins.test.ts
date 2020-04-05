import * as assert from "assert";
import { format, getText } from "./format.test";

suite("Test plugins", function () {
  this.timeout(10000);
  test("it formats with plugins", async () => {
    const { actual } = await format("plugins", "index.php");
    const expected = await getText("plugins", "index.result.php");
    assert.equal(actual, expected);
  });
});
