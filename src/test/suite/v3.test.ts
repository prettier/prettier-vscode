import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("Tests for Prettier v3", () => {
  it("it formats by Prettier v3", async () => {
    const { actual } = await format("v3", "index.ts", /* shouldRetry */ true);
    const expected = await getText("v3", "index.result.ts");
    assert.equal(actual, expected);
  });
});
