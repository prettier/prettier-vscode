/**
 * Replace [Unreleased] with [${package.version}]
 * sed like.
 */
const fs = require("fs");

const v = process.env.npm_package_version;
const CHANGELOG = "CHANGELOG.md";

fs.readFile(CHANGELOG, (error, data) => {
  const stringData = data.toString("utf8");
  const updated = stringData.replace(
    /## \[Unreleased\](?!\s*## )/, // None empty Unreleased block
    `## [Unreleased]\n\n## [${v}]`
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
