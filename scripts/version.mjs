/**
 * Replace [Unreleased] with [${package.version}]
 * sed like.
 *
 * For prereleases (versions containing -), skip changelog update
 * since the final release should include all unreleased changes.
 */
import fs from "fs/promises";

const v = process.env.npm_package_version;
const CHANGELOG = "CHANGELOG.md";

// Skip changelog update for prereleases (e.g., 12.0.0-preview.1)
const isPrerelease = v.includes("-");

if (isPrerelease) {
  console.log(`CHANGELOG: Skipping update for prerelease version ${v}`);
  process.exit(0);
}

const data = await fs.readFile(CHANGELOG, "utf8");
const updated = data.replace(
  /## \[Unreleased\](?!\s*## )/, // None empty Unreleased block
  `## [Unreleased]\n\n## [${v}]`,
);

if (updated !== data) {
  console.log(`CHANGELOG: [Unreleased] updated with [${v}]`);
}

await fs.writeFile(CHANGELOG, updated);
