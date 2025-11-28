#!/usr/bin/env node
/**
 * Automated release script for prettier-vscode
 *
 * Usage:
 *   pnpm release major   - Bump major version (11.0.0 -> 12.0.0)
 *   pnpm release minor   - Bump minor version (11.0.0 -> 11.1.0)
 *   pnpm release patch   - Bump patch version (11.0.0 -> 11.0.1)
 *   pnpm release preview - Create preview release (11.0.0 -> 11.1.0-preview.1)
 */
import fs from "fs/promises";
import { execSync } from "child_process";

const RELEASE_TYPES = ["major", "minor", "patch", "preview"];

function exec(cmd, options = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: "inherit", ...options });
}

function execQuiet(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function parseVersion(version) {
  // Handle prerelease versions like "11.1.0-preview.1"
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/i);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    prereleaseNum: match[5] ? parseInt(match[5], 10) : null,
  };
}

function formatVersion({ major, minor, patch, prerelease, prereleaseNum }) {
  let version = `${major}.${minor}.${patch}`;
  if (prerelease) {
    version += `-${prerelease}.${prereleaseNum}`;
  }
  return version;
}

async function updateChangelog(version) {
  const CHANGELOG = "CHANGELOG.md";
  const isPrerelease = version.includes("-");

  if (isPrerelease) {
    console.log(`Skipping changelog update for prerelease version ${version}`);
    return;
  }

  const data = await fs.readFile(CHANGELOG, "utf8");
  const updated = data.replace(
    /## \[Unreleased\](?!\s*## )/, // Non-empty Unreleased block
    `## [Unreleased]\n\n## [${version}]`,
  );

  if (updated !== data) {
    await fs.writeFile(CHANGELOG, updated);
    console.log(`Updated CHANGELOG.md with [${version}]`);
  } else {
    console.log("No changelog changes to record");
  }
}

function calculateNewVersion(currentVersion, releaseType) {
  const v = parseVersion(currentVersion);
  const isCurrentPrerelease = v.prerelease !== null;

  switch (releaseType) {
    case "major":
      // If current is prerelease of this major, just drop prerelease suffix
      // e.g., 12.0.0-preview.1 -> 12.0.0
      if (isCurrentPrerelease && v.minor === 0 && v.patch === 0) {
        return formatVersion({ ...v, prerelease: null, prereleaseNum: null });
      }
      // Otherwise bump major
      return formatVersion({
        major: v.major + 1,
        minor: 0,
        patch: 0,
        prerelease: null,
        prereleaseNum: null,
      });

    case "minor":
      // If current is prerelease of this minor, just drop prerelease suffix
      // e.g., 11.1.0-preview.1 -> 11.1.0
      if (isCurrentPrerelease && v.patch === 0) {
        return formatVersion({ ...v, prerelease: null, prereleaseNum: null });
      }
      // Otherwise bump minor
      return formatVersion({
        major: v.major,
        minor: v.minor + 1,
        patch: 0,
        prerelease: null,
        prereleaseNum: null,
      });

    case "patch":
      // If current is prerelease of this patch, just drop prerelease suffix
      // e.g., 11.0.1-preview.1 -> 11.0.1
      if (isCurrentPrerelease) {
        return formatVersion({ ...v, prerelease: null, prereleaseNum: null });
      }
      // Otherwise bump patch
      return formatVersion({
        major: v.major,
        minor: v.minor,
        patch: v.patch + 1,
        prerelease: null,
        prereleaseNum: null,
      });

    case "preview":
      // If already a preview, increment the preview number
      if (isCurrentPrerelease && v.prerelease === "preview") {
        return formatVersion({
          ...v,
          prereleaseNum: v.prereleaseNum + 1,
        });
      }
      // Otherwise, bump minor and start preview.1
      return formatVersion({
        major: v.major,
        minor: v.minor + 1,
        patch: 0,
        prerelease: "preview",
        prereleaseNum: 1,
      });

    default:
      throw new Error(`Unknown release type: ${releaseType}`);
  }
}

async function main() {
  const releaseType = process.argv[2];

  if (!releaseType || !RELEASE_TYPES.includes(releaseType)) {
    console.error("Usage: pnpm release <major|minor|patch|preview>");
    console.error("");
    console.error("Examples:");
    console.error("  pnpm release major   - 11.0.0 -> 12.0.0");
    console.error("  pnpm release minor   - 11.0.0 -> 11.1.0");
    console.error("  pnpm release patch   - 11.0.0 -> 11.0.1");
    console.error("  pnpm release preview - 11.0.0 -> 11.1.0-preview.1");
    process.exit(1);
  }

  // Check for uncommitted changes
  const status = execQuiet("git status --porcelain");
  if (status) {
    console.error("Error: Working directory is not clean.");
    console.error("Please commit or stash your changes before releasing.");
    process.exit(1);
  }

  // Stable releases must be on main branch
  const currentBranch = execQuiet("git rev-parse --abbrev-ref HEAD");
  if (releaseType !== "preview" && currentBranch !== "main") {
    console.error(
      `Error: ${releaseType} releases must be run from the main branch.`,
    );
    console.error(`Current branch: ${currentBranch}`);
    console.error("\nTo release a preview from this branch, use:");
    console.error("  pnpm release preview");
    process.exit(1);
  }

  // Read current version
  const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
  const currentVersion = packageJson.version;
  const newVersion = calculateNewVersion(currentVersion, releaseType);

  console.log(`\nRelease: ${releaseType}`);
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}\n`);

  // Update package.json
  packageJson.version = newVersion;
  await fs.writeFile(
    "package.json",
    JSON.stringify(packageJson, null, 2) + "\n",
  );
  console.log("Updated package.json");

  // Update changelog (skip for prereleases)
  await updateChangelog(newVersion);

  // Stage changes
  exec("git add package.json CHANGELOG.md");

  // Create commit and tag
  const tagName = `v${newVersion}`;
  exec(`git commit -m "${tagName}"`);
  exec(`git tag ${tagName}`);

  console.log(`\nCreated commit and tag: ${tagName}`);

  // Push to origin
  exec(`git push origin ${currentBranch} --tags`);

  console.log(`\nRelease ${tagName} pushed successfully!`);
  console.log("GitHub Actions will now build, test, and publish the release.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
