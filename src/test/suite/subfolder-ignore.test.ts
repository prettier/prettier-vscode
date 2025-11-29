import * as assert from "node:assert";
import { format } from "./format.test";

describe("Test subfolder .prettierignore", () => {
  it("does not format file in codebase-1 subfolder ignore", async () => {
    const { actual, source } = await format(
      "monorepo-ignore",
      "codebase-1/src/first-file-to-ignore.js",
    );
    // File should not be formatted, so actual should equal source
    assert.equal(actual, source);
  });

  it("formats file in codebase-1 not in ignore", async () => {
    const { actual, source } = await format(
      "monorepo-ignore",
      "codebase-1/src/first-script.js",
    );
    // File should be formatted, so actual should differ from source
    assert.notEqual(actual, source);
  });

  it("does not format file in codebase-2 subfolder ignore", async () => {
    const { actual, source } = await format(
      "monorepo-ignore",
      "codebase-2/src/second-file-to-ignore.js",
    );
    // File should not be formatted, so actual should equal source
    assert.equal(actual, source);
  });

  it("formats file in codebase-2 not in ignore", async () => {
    const { actual, source } = await format(
      "monorepo-ignore",
      "codebase-2/src/second-script.js",
    );
    // File should be formatted, so actual should differ from source
    assert.notEqual(actual, source);
  });
});
