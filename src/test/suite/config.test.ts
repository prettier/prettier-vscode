import * as assert from "assert";
import { format } from "./format.test";

const standardResult = `function foo() {
   console.log("test");
}
`;

const vscodeResult = `function foo() {
  const foo = [
    "aaaaaaaaa",
    "bbbbbb",
    "c",
    "a",
    "b",
    "c",
    "a",
    "b",
    "c",
    "a",
    "b",
    "c",
  ];
}
`;

const testConfig = (filePath: string, expected: string = standardResult) => {
  return async () => {
    const { result } = await format("config", filePath);
    assert.equal(result, expected);
  };
};

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
  test(
    "it uses config from .editorconfig file ",
    testConfig("editorconfig/test.js")
  );
  test(
    "it uses config from vscode settings ",
    testConfig("vscodeconfig/test.js", vscodeResult)
  );
});
