import * as assert from "assert";
import { format, getText } from "./format.test";

suite("ESM Config File Support", function () {
  this.timeout(10000);

  // This test validates Issue #3298 - ESM config without local prettier
  // Should use bundled Prettier (v3 after upgrade) to read ESM config
  test("it formats with ESM prettier.config.js (no local prettier)", async () => {
    const { actual } = await format(
      "esm-config",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("esm-config", "index.result.js");
    assert.equal(actual, expected);
  });
});
