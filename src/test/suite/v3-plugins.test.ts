import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("Test v3 + plugins", () => {
  it("it formats with v3 + plugins", async () => {
    const { actual } = await format(
      "v3-plugins",
      "index.xml",
      /* shouldRetry */ true,
    );
    const expected = await getText("v3-plugins", "index.result.xml");
    assert.equal(actual, expected);
  });
});
