#!/usr/bin/env node
/**
 * Automated release script for prettier-vscode
 *
 * Usage:
 *   pnpm release major              - Bump major version (11.0.0 -> 12.0.0)
 *   pnpm release minor              - Bump minor version (11.0.0 -> 11.1.0)
 *   pnpm release patch              - Bump patch version (11.0.0 -> 11.0.1)
 *   pnpm release patch --pre        - Patch as prerelease (tag: v11.0.1-pre)
 *   pnpm release minor 12.1.0       - Use specific version
 *   pnpm release patch 12.0.1 --pre - Specific version as prerelease
 */
import fs from "fs/promises";
import { execSync } from "child_process";

const RELEASE_TYPES = ["major", "minor", "patch"];

function exec(cmd, options = {}) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { stdio: "inherit", ...options });
}

function execQuiet(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

async function updateChangelog(version, isPrerelease) {
  const CHANGELOG = "CHANGELOG.md";

  if (isPrerelease) {
    console.log(`Skipping changelog update for prerelease`);
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

  switch (releaseType) {
    case "major":
      return formatVersion({
        major: v.major + 1,
        minor: 0,
        patch: 0,
      });

    case "minor":
      return formatVersion({
        major: v.major,
        minor: v.minor + 1,
        patch: 0,
      });

    case "patch":
      return formatVersion({
        major: v.major,
        minor: v.minor,
        patch: v.patch + 1,
      });

    default:
      throw new Error(`Unknown release type: ${releaseType}`);
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const isPrerelease = args.includes("--pre");
  const positional = args.filter((arg) => !arg.startsWith("--"));

  return {
    releaseType: positional[0],
    manualVersion: positional[1],
    isPrerelease,
  };
}

async function main() {
  const { releaseType, manualVersion, isPrerelease } = parseArgs(process.argv);

  if (!releaseType || !RELEASE_TYPES.includes(releaseType)) {
    console.error("Usage: pnpm release <major|minor|patch> [version] [--pre]");
    console.error("");
    console.error("Examples:");
    console.error("  pnpm release major              - 11.0.0 -> 12.0.0");
    console.error("  pnpm release minor              - 11.0.0 -> 11.1.0");
    console.error("  pnpm release patch              - 11.0.0 -> 11.0.1");
    console.error(
      "  pnpm release patch --pre        - 11.0.0 -> 11.0.1 (tag: v11.0.1-pre)",
    );
    console.error("  pnpm release minor 12.1.0       - Use specific version");
    console.error(
      "  pnpm release patch 12.0.1 --pre - Specific version as prerelease",
    );
    process.exit(1);
  }

  // Validate manual version if provided
  if (manualVersion) {
    try {
      parseVersion(manualVersion);
    } catch {
      console.error(`Error: Invalid version format: ${manualVersion}`);
      console.error("Expected format: X.Y.Z (e.g., 12.0.1)");
      process.exit(1);
    }
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
  if (!isPrerelease && currentBranch !== "main") {
    console.error(`Error: Stable releases must be run from the main branch.`);
    console.error(`Current branch: ${currentBranch}`);
    console.error("\nTo release a prerelease from this branch, use:");
    console.error("  pnpm release <major|minor|patch> --pre");
    process.exit(1);
  }

  // Read current version
  const packageJson = JSON.parse(await fs.readFile("package.json", "utf8"));
  const currentVersion = packageJson.version;
  const newVersion =
    manualVersion || calculateNewVersion(currentVersion, releaseType);

  const tagName = isPrerelease ? `v${newVersion}-pre` : `v${newVersion}`;

  console.log(
    `\nRelease: ${releaseType}${isPrerelease ? " (prerelease)" : ""}`,
  );
  console.log(`Current version: ${currentVersion}`);
  console.log(`New version: ${newVersion}`);
  console.log(`Tag: ${tagName}\n`);

  // Update package.json
  packageJson.version = newVersion;
  await fs.writeFile(
    "package.json",
    JSON.stringify(packageJson, null, 2) + "\n",
  );
  console.log("Updated package.json");

  // Update changelog (skip for prereleases)
  await updateChangelog(newVersion, isPrerelease);

  // Stage changes
  exec("git add package.json CHANGELOG.md");

  // Create commit and tag
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
