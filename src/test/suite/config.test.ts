import * as assert from "assert";
import {
  format,
  getText,
  moveRootPrettierRC,
  putBackPrettierRC,
} from "./format.test";

const testConfig = (testPath: string, resultPath: string) => {
  return async () => {
    const { actual } = await format("config", testPath);
    const expected = await getText("config", resultPath);
    assert.equal(actual, expected);
  };
};

suite("Test configurations", function () {
  this.timeout(10000);
  this.beforeAll(moveRootPrettierRC);
  this.afterAll(putBackPrettierRC);
  test(
    "it uses config from .prettierrc file and does not inherit VS Code settings ",
    /* cspell: disable-next-line */
    testConfig("rcfile/test.js", "rcfile/test.result.js")
  );
  test(
    "it uses config from prettier.config.js file ",
    /* cspell: disable-next-line */
    testConfig("jsconfigfile/test.js", "jsconfigfile/test.result.js")
  );
  test(
    "it uses config from .prettierrc.js file ",
    /* cspell: disable-next-line */
    testConfig("jsfile/test.js", "jsfile/test.result.js")
  );
  test(
    "it uses config from .prettierrc.js file for hbs files",
    /* cspell: disable-next-line */
    testConfig("hbsfile/test.hbs", "hbsfile/test.result.hbs")
  );
  test(
    "it uses config from .editorconfig file ",
    testConfig("editorconfig/test.js", "editorconfig/test.result.js")
  );
  test(
    "it uses config from vscode settings ",
    /* cspell: disable-next-line */
    testConfig("vscodeconfig/test.js", "vscodeconfig/test.result.js")
  );
  test(
    "it formats custom file extension ",
    /* cspell: disable-next-line */
    testConfig("customextension/test.abc", "customextension/test.result.abc")
  );
});
