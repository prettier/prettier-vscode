import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { format } from "./format.test";

const testConfig = (filePath: string) => {
  return async () => {
    const { result } = await format("config", filePath);
    assert.equal(
      result,
      `function foo() {
   console.log("test");
}
`
    );
  };
};

const prettierrcFileNormal = path.join(__dirname, "../../../.prettierrc");
const prettierrcFileTemp = path.join(__dirname, "../../../.prettierrc");

suite("Test configurations", function() {
  this.timeout(10000);
  test("it uses config from .prettierrc file ", testConfig("rcfile/test.js"));
  test(
    "it uses config from prettier.config.js file ",
    testConfig("jsconfigfile/test.js")
  );
  test(
    "it uses config from .prettierrc.js file ",
    testConfig("jsfile/test.js")
  );
  test("it uses config from .editorconfig file ", () => {
    // Rename .prettierrc so we dont override config of the .editorconfig test
    fs.renameSync(prettierrcFileNormal, prettierrcFileTemp);
    testConfig("editorconfig/test.js");
    // Move back
    fs.renameSync(prettierrcFileTemp, prettierrcFileNormal);
  });
});
