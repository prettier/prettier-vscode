import * as assert from "assert";
import * as vscode from "vscode";
import { ensureExtensionActivated } from "./testUtils.js";

const EXTENSION_ID = "prettier.prettier-vscode";

/**
 * Helper to get problem matchers from extension
 */
function getProblemMatchers() {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension, "Extension should be available");
  return extension.packageJSON.contributes.problemMatchers;
}

/**
 * Helper to get a specific problem matcher by name
 */
function getMatcher(name: string) {
  const matchers = getProblemMatchers();
  const matcher = matchers.find((m: { name: string }) => m.name === name);
  assert.ok(matcher, `Should have '${name}' problem matcher`);
  return matcher;
}

describe("Problem Matchers", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("should have problem matchers registered", () => {
    const matchers = getProblemMatchers();
    assert.ok(Array.isArray(matchers), "Problem matchers should be an array");
    assert.ok(matchers.length > 0, "Should have at least one problem matcher");
  });

  it("should have prettier problem matcher registered", () => {
    const prettierMatcher = getMatcher("prettier");
    assert.strictEqual(
      prettierMatcher.owner,
      "prettier",
      "Owner should be 'prettier'",
    );
    assert.ok(prettierMatcher.pattern, "Should have a pattern");
    assert.ok(prettierMatcher.pattern.regexp, "Pattern should have a regexp");
  });

  it("should have prettier-warn problem matcher registered", () => {
    const warnMatcher = getMatcher("prettier-warn");
    assert.strictEqual(
      warnMatcher.severity,
      "warning",
      "Severity should be 'warning'",
    );
    assert.ok(warnMatcher.pattern, "Should have a pattern");
  });

  it("should have prettier-watch problem matcher registered", () => {
    const watchMatcher = getMatcher("prettier-watch");
    assert.ok(
      watchMatcher.background,
      "Watch matcher should have background mode",
    );
  });

  it("should have prettier-warn-watch problem matcher registered", () => {
    const warnWatchMatcher = getMatcher("prettier-warn-watch");
    assert.ok(
      warnWatchMatcher.background,
      "Watch matcher should have background mode",
    );
  });

  describe("Pattern matching", () => {
    it("prettier pattern should match error output with line and column", () => {
      const prettierMatcher = getMatcher("prettier");
      const pattern = new RegExp(prettierMatcher.pattern.regexp);

      // Test cases from actual prettier output
      const testCases = [
        {
          input: "[error] test.js: SyntaxError: Unexpected token (3:1)",
          expected: {
            severity: "error",
            file: "test.js",
            message: "SyntaxError: Unexpected token",
            line: "3",
            column: "1",
          },
        },
        {
          input:
            '[error] src/file.d.ts: SyntaxError: Unexpected token, expected "," (10:5)',
          expected: {
            severity: "error",
            file: "src/file.d.ts",
            message: 'SyntaxError: Unexpected token, expected ","',
            line: "10",
            column: "5",
          },
        },
      ];

      testCases.forEach((testCase) => {
        const match = testCase.input.match(pattern);
        assert.ok(match, `Should match: ${testCase.input}`);
        assert.strictEqual(
          match[1],
          testCase.expected.severity,
          "Should extract severity",
        );
        assert.strictEqual(
          match[2],
          testCase.expected.file,
          "Should extract file",
        );
        assert.strictEqual(
          match[3],
          testCase.expected.message,
          "Should extract message",
        );
        assert.strictEqual(
          match[4],
          testCase.expected.line,
          "Should extract line",
        );
        assert.strictEqual(
          match[5],
          testCase.expected.column,
          "Should extract column",
        );
      });
    });

    it("prettier-warn pattern should match warning output", () => {
      const warnMatcher = getMatcher("prettier-warn");
      const pattern = new RegExp(warnMatcher.pattern.regexp);

      // Test cases from actual prettier output
      const shouldMatch = [
        { input: "[warn] test.js", expected: "test.js" },
        { input: "[warn] src/bad.js", expected: "src/bad.js" },
        { input: "[warn] file.test.tsx", expected: "file.test.tsx" },
        { input: "[warn] component.d.ts", expected: "component.d.ts" },
        { input: "[warn] styles.module.css", expected: "styles.module.css" },
        // Edge cases: directories with dots
        { input: "[warn] src/v2.0/file.js", expected: "src/v2.0/file.js" },
        {
          input: "[warn] dist/1.2.3/bundle.js",
          expected: "dist/1.2.3/bundle.js",
        },
        // Edge cases: multiple dots in filename
        {
          input: "[warn] component.test.d.ts",
          expected: "component.test.d.ts",
        },
        { input: "[warn] api.v2.spec.ts", expected: "api.v2.spec.ts" },
        // Edge cases: underscores and hyphens
        { input: "[warn] my-component_v2.js", expected: "my-component_v2.js" },
        {
          input: "[warn] user_profile-api.ts",
          expected: "user_profile-api.ts",
        },
        {
          input: "[warn] test_file-name.spec.js",
          expected: "test_file-name.spec.js",
        },
      ];

      shouldMatch.forEach((testCase) => {
        const match = testCase.input.match(pattern);
        assert.ok(match, `Should match: ${testCase.input}`);
        assert.strictEqual(
          match[1],
          testCase.expected,
          `Should extract file: ${testCase.expected}`,
        );
      });

      // Test cases that should NOT match (summary messages)
      const shouldNotMatch = [
        "[warn] Code style issues found in the above file.",
        "[warn] Code style issues found in 3 files.",
        "[warn] All matched files use Prettier code style!",
      ];

      shouldNotMatch.forEach((testCase) => {
        const match = testCase.input.match(pattern);
        assert.ok(!match, `Should NOT match: ${testCase}`);
      });
    });

    it("background patterns should match start and end markers", () => {
      const watchMatcher = getMatcher("prettier-watch");
      const beginsPattern = new RegExp(watchMatcher.background.beginsPattern);
      const endsPattern = new RegExp(watchMatcher.background.endsPattern);

      // Test begin pattern
      assert.ok(
        beginsPattern.test("Checking formatting..."),
        "Should match begin pattern",
      );

      // Test end patterns
      assert.ok(
        endsPattern.test("[warn] Code style issues found in the above file(s)"),
        "Should match end pattern for warnings",
      );
      assert.ok(
        endsPattern.test("All matched files use Prettier code style!"),
        "Should match end pattern for success",
      );
    });
  });
});
