import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("Test prettierExecutable configuration", () => {
  it("formats using external executable specified in settings", async () => {
    const { actual } = await format(
      "executable",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("executable", "index.result.js");
    assert.equal(actual, expected);
  });
});
