import * as assert from "assert";
import { platform } from "os";
import { format, getText } from "./format.test";

suite("Test plugins", function() {
  this.timeout(10000);
  test("it formats with plugins", async () => {
    if (platform() === "win32") {
      return assert.ok(true, "Skipping test on windows.");
    }
    const { actual } = await format("plugins", "index.php");
    const expected = await getText("plugins", "index.result.php");
    // Normalize these to account for CRLF issues on Windows
    assert.equal(actual.normalize(), expected.normalize());
  });
});
