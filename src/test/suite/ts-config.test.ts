import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("TypeScript Config File Support", () => {
  // This test validates TypeScript config file support added in Prettier 3.5.0
  // Should use Prettier to read TypeScript config files like prettier.config.ts
  it("it formats with TypeScript prettier.config.ts", async () => {
    const { actual } = await format(
      "ts-config",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("ts-config", "index.result.js");
    assert.equal(actual, expected);
  });
});
