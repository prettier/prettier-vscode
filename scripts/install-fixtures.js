const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const testFixturesDir = path.join(__dirname, "..", "test-fixtures");

/**
 * Get the install command based on packageManager field
 */
function getInstallCommand(packageManager) {
  if (!packageManager) {
    return "pnpm install";
  }
  if (packageManager.startsWith("yarn")) {
    return "yarn install";
  }
  if (packageManager.startsWith("npm")) {
    return "npm install";
  }
  if (packageManager.startsWith("pnpm")) {
    return "pnpm install";
  }
  return "pnpm install";
}

/**
 * Install dependencies for a fixture directory
 */
function installFixture(fixtureDir, pkgJson) {
  const packageManager = pkgJson.packageManager;
  const cmd = getInstallCommand(packageManager);
  const relativePath = path.relative(process.cwd(), fixtureDir);

  console.log(`Installing ${relativePath} (${packageManager || "default"})`);

  try {
    execSync(cmd, {
      cwd: fixtureDir,
      stdio: "inherit",
    });
  } catch (error) {
    console.error(`Failed to install ${relativePath}`);
    process.exit(1);
  }
}

/**
 * Find all package.json files in test-fixtures (including nested)
 */
function findFixtures(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const pkgPath = path.join(fullPath, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkgJson = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          results.push({ dir: fullPath, pkgJson });

          // Check for nested fixtures (like explicit-dep/implicit-dep)
          findFixtures(fullPath, results);
        } catch (e) {
          console.error(`Failed to parse ${pkgPath}`);
        }
      }
    }
  }

  return results;
}

// Main
const fixtures = findFixtures(testFixturesDir);

console.log(`Found ${fixtures.length} test fixtures to install\n`);

for (const { dir, pkgJson } of fixtures) {
  installFixture(dir, pkgJson);
  console.log("");
}

console.log("All fixtures installed successfully!");
