import * as assert from "assert";
import { format } from "./format.test";

suite("Test ignore", function() {
  this.timeout(10000);
  test("it does not format file", async () => {
    const { result, source } = await format("project", "fileToIgnore.js");
    assert.equal(result, source);
  });
  /* cspell: disable-next-line */
  test("it does not format subfolder/*", async () => {
    const { result, source } = await format("project", "ignoreMe2/index.js");
    assert.equal(result, source);
  });
  /* cspell: disable-next-line */
  test("it does not format sub-subfolder", async () => {
    const { result, source } = await format(
      "project",
      /* cspell: disable-next-line */
      "ignoreMe/subdir/index.js"
    );
    assert.equal(result, source);
  });
});
