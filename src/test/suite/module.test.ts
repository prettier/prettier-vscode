import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("Test module resolution", () => {
  it("it formats without prettier dep using internal version", async () => {
    const { actual } = await format(
      "no-dep",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("no-dep", "index.result.js");
    assert.equal(actual, expected);
  });

  it("it formats without prettier in package.json", async () => {
    const { actual } = await format(
      "module",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("module", "index.result.js");
    assert.equal(actual, expected);
  });

  it("it loads plugin referenced in dependency module", async () => {
    const { actual } = await format(
      "module-plugin",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("module-plugin", "index.result.js");
    assert.equal(actual, expected);
  });
});
