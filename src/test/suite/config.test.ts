import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { format, getText } from "./format.test";

const testConfig = (testPath: string, resultPath: string) => {
  return async () => {
    const { result } = await format("config", testPath);
    const expected = await getText("config", resultPath);
    assert.equal(result, expected);
  };
};

const prettierConfigOrig = path.resolve(__dirname, "../../../.prettierrc");
const prettierConfigTemp = path.resolve(__dirname, "../../../old.prettierrc");

suite("Test configurations", function() {
  this.timeout(10000);
  this.beforeAll(cb => {
    fs.rename(prettierConfigOrig, prettierConfigTemp, cb);
  });
  this.afterAll(cb => {
    fs.rename(prettierConfigTemp, prettierConfigOrig, cb);
  });
  test(
    "it uses config from .prettierrc file and does not inherit VS Code settings ",
    testConfig("rcfile/test.js", "rcfile/test.result.js")
  );
  test(
    "it uses config from prettier.config.js file ",
    testConfig("jsconfigfile/test.js", "jsconfigfile/test.result.js")
  );
  test(
    "it uses config from .prettierrc.js file ",
    testConfig("jsfile/test.js", "jsfile/test.result.js")
  );
  test(
    "it uses config from .editorconfig file ",
    testConfig("editorconfig/test.js", "editorconfig/test.result.js")
  );
  test(
    "it uses config from vscode settings ",
    testConfig("vscodeconfig/test.js", "vscodeconfig/test.result.js")
  );
});
