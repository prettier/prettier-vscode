/**
 * Replace [Unreleased] with [${package.version}]
 * sed like.
 *
 * For prereleases (versions containing -), skip changelog update
 * since the final release should include all unreleased changes.
 */
const fs = require("fs");

const v = process.env.npm_package_version;
const CHANGELOG = "CHANGELOG.md";

// Skip changelog update for prereleases (e.g., 12.0.0-preview.1)
const isPrerelease = v.includes("-");

if (isPrerelease) {
  console.log(`CHANGELOG: Skipping update for prerelease version ${v}`);
  process.exit(0);
}

fs.readFile(CHANGELOG, (error, data) => {
  const stringData = data.toString("utf8");
  const updated = stringData.replace(
    /## \[Unreleased\](?!\s*## )/, // None empty Unreleased block
    `## [Unreleased]\n\n## [${v}]`,
  );

  if (updated !== stringData) {
    console.log(`CHANGELOG: [Unreleased] updated with [${v}]`);
  }
  fs.writeFile(CHANGELOG, updated, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
  });
});
