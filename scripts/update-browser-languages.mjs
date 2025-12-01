#!/usr/bin/env node
/**
 * Script to update the static configuration in ModuleResolverWeb.ts
 * Run this after updating Prettier to pick up any changes to languages/parsers.
 *
 * Usage: node scripts/update-browser-languages.mjs
 */

import * as prettier from "prettier";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const browserResolverPath = join(__dirname, "../src/ModuleResolverWeb.ts");

/**
 * Get plugin names that ship with Prettier from its package.json exports.
 * These correspond to prettier/plugins/* modules.
 */
function getBrowserAvailablePlugins() {
  const require = createRequire(import.meta.url);
  const prettierPkgPath = require.resolve("prettier/package.json");
  const pkg = JSON.parse(readFileSync(prettierPkgPath, "utf8"));
  const exports = pkg.exports || {};

  return Object.keys(exports)
    .filter((k) => k.startsWith("./plugins/"))
    .map((k) => k.replace("./plugins/", ""))
    .sort();
}

const BROWSER_AVAILABLE_PLUGINS = getBrowserAvailablePlugins();

/**
 * Map Prettier language names to VS Code language IDs.
 * This handles cases where Prettier's linguistLanguageId doesn't match VS Code.
 */
const VSCODE_LANGUAGE_ID_OVERRIDES = {
  JavaScript: ["javascript", "javascriptreact", "mongo", "mongodb"],
  TypeScript: ["typescript"],
  TSX: ["typescriptreact"],
  JSON: ["json"],
  "JSON with Comments": ["jsonc"],
  JSON5: ["json5"],
  Handlebars: ["handlebars"],
  GraphQL: ["graphql"],
  Markdown: ["markdown"],
  MDX: ["mdx"],
  HTML: ["html"],
  Angular: ["html"],
  "Lightning Web Components": ["html"],
  Vue: ["vue"],
  YAML: ["yaml", "ansible", "home-assistant"],
  CSS: ["css"],
  Less: ["less"],
  SCSS: ["scss"],
};

async function main() {
  console.log("Fetching Prettier support info...");
  const supportInfo = await prettier.getSupportInfo();

  console.log(`Found ${supportInfo.languages.length} languages`);

  // Build the languages array with vscodeLanguageIds
  const languages = supportInfo.languages
    .filter((lang) => {
      // Only include languages that have parsers we can use in the browser
      return lang.parsers && lang.parsers.length > 0;
    })
    .map((lang) => {
      // Get vscodeLanguageIds from our overrides or from vscodeLanguageIds field
      let vscodeLanguageIds = VSCODE_LANGUAGE_ID_OVERRIDES[lang.name];
      if (!vscodeLanguageIds) {
        if (lang.vscodeLanguageIds) {
          vscodeLanguageIds = lang.vscodeLanguageIds;
        } else {
          // Use name as fallback (linguistLanguageId is now a numeric ID, not useful)
          vscodeLanguageIds = [lang.name.toLowerCase().replace(/\s+/g, "-")];
        }
      }

      return {
        name: lang.name,
        vscodeLanguageIds,
        extensions: lang.extensions || [],
        parsers: lang.parsers,
      };
    })
    // Filter out languages without VS Code language IDs
    .filter((lang) => lang.vscodeLanguageIds.length > 0);

  // Generate the languages code
  const languagesCode = languages
    .map(
      (lang) => `            {
              name: "${lang.name}",
              vscodeLanguageIds: ${JSON.stringify(lang.vscodeLanguageIds)},
              extensions: ${JSON.stringify(lang.extensions || [])},
              parsers: ${JSON.stringify(lang.parsers)},
            }`,
    )
    .join(",\n");

  // Generate the imports code
  const importsCode = BROWSER_AVAILABLE_PLUGINS.map(
    (plugin) =>
      `import * as ${plugin}Plugin from "prettier/plugins/${plugin}";`,
  ).join("\n");

  // Generate the plugins array code
  const pluginsArrayCode = BROWSER_AVAILABLE_PLUGINS.map(
    (plugin) => `  ${plugin}Plugin,`,
  ).join("\n");

  // Read the current file
  console.log(`Reading ${browserResolverPath}...`);
  const currentContent = readFileSync(browserResolverPath, "utf8");

  // Check if there are changes needed
  const newContent = generateNewContent(
    currentContent,
    languagesCode,
    importsCode,
    pluginsArrayCode,
  );

  if (newContent !== currentContent) {
    console.log("Writing updated content...");
    writeFileSync(browserResolverPath, newContent);
    console.log("Updated ModuleResolverWeb.ts successfully!");
    console.log("\nLanguages included:");
    languages.forEach((lang) => {
      console.log(
        `  - ${lang.name}: ${lang.vscodeLanguageIds.join(", ")} [${lang.parsers.join(", ")}]`,
      );
    });
  } else {
    console.log("No changes needed - file is up to date.");
  }

  // Print the Prettier version
  console.log(`\nUsing Prettier version: ${prettier.version}`);
}

function generateNewContent(
  currentContent,
  languagesCode,
  _importsCode,
  _pluginsArrayCode,
) {
  let content = currentContent;

  // Update the languages array in getSupportInfo
  const languagesRegex =
    /(languages:\s*\[\s*\n)([\s\S]*?)(\s*\],\s*\};[\s\S]*?getFileInfo)/;
  const languagesMatch = content.match(languagesRegex);
  if (languagesMatch) {
    content = content.replace(
      languagesRegex,
      `$1${languagesCode}\n          $3`,
    );
  } else {
    console.warn("Warning: Could not find languages array pattern to replace.");
    console.log(
      "Please manually update the languages array in getSupportInfo.",
    );
  }

  return content;
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
