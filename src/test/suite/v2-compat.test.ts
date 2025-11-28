import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("Prettier v2 Backward Compatibility", () => {
  it("it formats with explicit Prettier v2 dependency", async () => {
    const { actual } = await format(
      "v2-explicit",
      "index.ts",
      /* shouldRetry */ true,
    );
    const expected = await getText("v2-explicit", "index.result.ts");
    assert.equal(actual, expected);
  });
});
