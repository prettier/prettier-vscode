import * as assert from "assert";
import * as os from "os";
import { format, getText } from "./format.test";

const t = os.platform() === "linux" ? test.skip : test;

suite("Test plugins", function () {
  this.timeout(10000);
  t("it formats with plugins", async () => {
    const { actual } = await format("plugins", "index.php");
    const expected = await getText("plugins", "index.result.php");
    assert.equal(actual, expected);
  });

  t(
    "it correctly resolved plugin in pnpm node_modules dirs structure",
    async () => {
      const { actual } = await format("plugins-pnpm", "index.js");
      const expected = await getText("plugins-pnpm", "index.result.js");
      assert.equal(actual, expected);
    }
  );
});
