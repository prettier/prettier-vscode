import * as assert from "assert";
import * as prettier from "prettier";
import { ensureExtensionActivated } from "./testUtils.js";
import { format } from "./formatTestUtils.js";

/**
 * Compare prettier's output (default settings)
 * with the output from extension.
 * @param file path relative to workspace root
 */
async function formatSameAsPrettier(
  file: string,
  options?: Partial<prettier.Options>,
) {
  const prettierOptions: prettier.Options = {
    ...options,
    ...{
      /* cspell: disable-next-line */
      filepath: file,
    },
  };
  const { actual, source } = await format("project", file);
  const prettierFormatted = await prettier.format(source, prettierOptions);
  assert.equal(actual, prettierFormatted);
}

describe("Test format Document", () => {
  before(async () => {
    await ensureExtensionActivated();
  });

  it("formats JavaScript", async () => {
    const { actual, source } = await format("project", "formatTest/ugly.js");
    const prettierFormatted = await prettier.format(source, {
      filepath: "formatTest/ugly.js",
    });
    assert.equal(actual, prettierFormatted);
  });
  it("formats TypeScript", () => formatSameAsPrettier("formatTest/ugly.ts"));
  it("formats CSS", () => formatSameAsPrettier("formatTest/ugly.css"));
  it("formats JSON", () => formatSameAsPrettier("formatTest/ugly.json"));
  it("formats JSONC", () => formatSameAsPrettier("formatTest/ugly.jsonc"));
  it("formats JSON", () => formatSameAsPrettier("formatTest/package.json"));
  it("formats HTML", () => formatSameAsPrettier("formatTest/ugly.html"));
  it("formats LWC", () =>
    formatSameAsPrettier("formatTest/lwc.html", { parser: "lwc" }));
  it("formats TSX", () => formatSameAsPrettier("formatTest/ugly.tsx"));
  it("formats SCSS", () => formatSameAsPrettier("formatTest/ugly.scss"));
  it("formats GraphQL", () => formatSameAsPrettier("formatTest/ugly.graphql"));
  it("formats HTML with literals", () =>
    formatSameAsPrettier("formatTest/htmlWithLiterals.html"));
  it("formats Vue", () => formatSameAsPrettier("formatTest/ugly.vue"));
  it("formats HBS", () => formatSameAsPrettier("formatTest/ugly.hbs"));
});
