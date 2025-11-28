import * as assert from "node:assert";
import {
  format,
  getText,
  moveRootPrettierRC,
  putBackPrettierRC,
} from "./format.test";

const testConfig = (
  testPath: string,
  resultPath: string,
  shouldRetry = false,
) => {
  return async () => {
    const { actual } = await format("config", testPath, shouldRetry);
    const expected = await getText("config", resultPath);
    assert.equal(actual, expected);
  };
};

describe("Test configurations", () => {
  before(() => moveRootPrettierRC());
  after(() => putBackPrettierRC());

  it(
    "it uses config from .prettierrc file and does not inherit VS Code settings ",
    /* cspell: disable-next-line */
    // Use retry for first test as extension may need time after root .prettierrc is moved
    testConfig("rcfile/test.js", "rcfile/test.result.js", true),
  );
  it(
    "it uses config from prettier.config.js file ",
    /* cspell: disable-next-line */
    testConfig("jsconfigfile/test.js", "jsconfigfile/test.result.js"),
  );
  it(
    "it uses config from .prettierrc.js file ",
    /* cspell: disable-next-line */
    testConfig("jsfile/test.js", "jsfile/test.result.js"),
  );
  it(
    "it uses config from .prettierrc.js file for hbs files",
    /* cspell: disable-next-line */
    testConfig("hbsfile/test.hbs", "hbsfile/test.result.hbs"),
  );
  it(
    "it uses config from .editorconfig file ",
    testConfig("editorconfig/test.js", "editorconfig/test.result.js"),
  );
  it(
    "it uses config from vscode settings ",
    /* cspell: disable-next-line */
    testConfig("vscodeconfig/test.js", "vscodeconfig/test.result.js"),
  );
  it(
    "it uses config from vscode settings with language overridables ",
    /* cspell: disable-next-line */
    testConfig(
      "vscodeconfig-language-overridable/test.ts",
      "vscodeconfig-language-overridable/test.result.ts",
    ),
  );
  it(
    "it formats custom file extension ",
    /* cspell: disable-next-line */
    testConfig("customextension/test.abc", "customextension/test.result.abc"),
  );
});
