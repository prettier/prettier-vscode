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

  // .prettierrc (JSON without extension)
  it(
    "it uses config from .prettierrc file and does not inherit VS Code settings ",
    // Use retry for first test as extension may need time after root .prettierrc is moved
    testConfig("rcfile/test.js", "rcfile/test.result.js", true),
  );

  // .prettierrc.json
  it(
    "it uses config from .prettierrc.json file",
    testConfig("jsonfile/test.js", "jsonfile/test.result.js"),
  );

  // .prettierrc.json5
  it(
    "it uses config from .prettierrc.json5 file",
    testConfig("json5file/test.js", "json5file/test.result.js"),
  );

  // .prettierrc.yaml
  it(
    "it uses config from .prettierrc.yaml file",
    testConfig("yamlfile/test.js", "yamlfile/test.result.js"),
  );

  // .prettierrc.yml
  it(
    "it uses config from .prettierrc.yml file",
    testConfig("ymlfile/test.js", "ymlfile/test.result.js"),
  );

  // .prettierrc.toml
  it(
    "it uses config from .prettierrc.toml file",
    testConfig("tomlfile/test.js", "tomlfile/test.result.js"),
  );

  // .prettierrc.js (CommonJS)
  it(
    "it uses config from .prettierrc.js file",
    testConfig("jsfile/test.js", "jsfile/test.result.js"),
  );

  // .prettierrc.cjs (CommonJS explicit)
  it(
    "it uses config from .prettierrc.cjs file",
    testConfig("cjsfile/test.js", "cjsfile/test.result.js"),
  );

  // .prettierrc.mjs (ESM)
  it(
    "it uses config from .prettierrc.mjs file",
    testConfig("mjsfile/test.js", "mjsfile/test.result.js"),
  );

  // prettier.config.js (CommonJS)
  it(
    "it uses config from prettier.config.js file",
    testConfig("jsconfigfile/test.js", "jsconfigfile/test.result.js"),
  );

  // prettier.config.cjs (CommonJS explicit)
  it(
    "it uses config from prettier.config.cjs file",
    testConfig("cjsconfigfile/test.js", "cjsconfigfile/test.result.js"),
  );

  // prettier.config.mjs (ESM)
  it(
    "it uses config from prettier.config.mjs file",
    testConfig("mjsconfigfile/test.js", "mjsconfigfile/test.result.js"),
  );

  // package.json with "prettier" key
  it(
    "it uses config from package.json prettier key",
    testConfig("pkgjson/test.js", "pkgjson/test.result.js"),
  );

  // .prettierrc.js for handlebars files
  it(
    "it uses config from .prettierrc.js file for hbs files",
    testConfig("hbsfile/test.hbs", "hbsfile/test.result.hbs"),
  );

  // .editorconfig
  it(
    "it uses config from .editorconfig file",
    testConfig("editorconfig/test.js", "editorconfig/test.result.js"),
  );

  // VS Code settings
  it(
    "it uses config from vscode settings",
    testConfig("vscodeconfig/test.js", "vscodeconfig/test.result.js"),
  );

  // VS Code settings with language overridables
  it(
    "it uses config from vscode settings with language overridables",
    testConfig(
      "vscodeconfig-language-overridable/test.ts",
      "vscodeconfig-language-overridable/test.result.ts",
    ),
  );

  // Custom file extension
  it(
    "it formats custom file extension",
    testConfig("customextension/test.abc", "customextension/test.result.abc"),
  );

  // prettier.config.ts (TypeScript) - requires Prettier >= 3.5.0
  // This fixture has its own package.json with local Prettier for TS config support
  it(
    "it uses config from prettier.config.ts file",
    testConfig("tsconfigfile/test.js", "tsconfigfile/test.result.js"),
  );

  // .prettierrc.ts (TypeScript ESM) - requires Prettier >= 3.5.0
  it(
    "it uses config from .prettierrc.ts file",
    testConfig("prettierrctsfile/test.js", "prettierrctsfile/test.result.js"),
  );

  // .prettierrc.cts (TypeScript CommonJS) - requires Prettier >= 3.5.0
  it(
    "it uses config from .prettierrc.cts file",
    testConfig("prettierrccts/test.js", "prettierrccts/test.result.js"),
  );

  // .prettierrc.mts (TypeScript ESM explicit) - requires Prettier >= 3.5.0
  it(
    "it uses config from .prettierrc.mts file",
    testConfig("prettierrcmts/test.js", "prettierrcmts/test.result.js"),
  );

  // prettier.config.cts (TypeScript CommonJS) - requires Prettier >= 3.5.0
  it(
    "it uses config from prettier.config.cts file",
    testConfig("configcts/test.js", "configcts/test.result.js"),
  );

  // prettier.config.mts (TypeScript ESM explicit) - requires Prettier >= 3.5.0
  it(
    "it uses config from prettier.config.mts file",
    testConfig("configmts/test.js", "configmts/test.result.js"),
  );
});
