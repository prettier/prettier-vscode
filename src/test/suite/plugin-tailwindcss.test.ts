import * as assert from "node:assert";
import { format, getText } from "./format.test";

describe("Test plugin-tailwindcss", () => {
  it("it formats with prettier-plugin-tailwindcss", async () => {
    const { actual } = await format(
      "plugin-tailwindcss",
      "index.js",
      /* shouldRetry */ true,
    );
    const expected = await getText("plugin-tailwindcss", "index.result.js");
    assert.equal(actual, expected);
  });
});
