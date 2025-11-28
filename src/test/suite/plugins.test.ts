import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("Test plugins", () => {
  it("it formats with plugins", async () => {
    const { actual } = await format(
      "plugins",
      "index.php",
      /* shouldRetry */ true,
    );
    const expected = await getText("plugins", "index.result.php");
    assert.equal(actual, expected);
  });

  it("it correctly resolved plugin in pnpm node_modules dirs structure", async () => {
    const { actual } = await format(
      "plugins-pnpm",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("plugins-pnpm", "index.result.js");
    assert.equal(actual, expected);
  });

  it("it should be able to obtain the `inferredParser` of the plugin", async () => {
    const { actual } = await format("plugins-pnpm", "index.php");
    const expected = await getText("plugins-pnpm", "index.result.php");
    assert.equal(actual, expected);
  });
});
