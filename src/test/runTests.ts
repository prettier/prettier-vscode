import * as path from "path";
import { runTests } from "@vscode/test-electron";
import * as tmp from "tmp";
import * as fs from "fs-extra";

async function createTempDir() {
  return new Promise<string>((resolve, reject) => {
    tmp.dir((err, dir) => {
      if (err) {
        return reject(err);
      }
      resolve(dir);
    });
  });
}

async function createSettings(): Promise<string> {
  const userDataDirectory = await createTempDir();
  process.env.VSC_JUPYTER_VSCODE_SETTINGS_DIR = userDataDirectory;
  const settingsFile = path.join(userDataDirectory, "User", "settings.json");
  const defaultSettings: Record<string, string | boolean | string[]> = {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "prettier.enableDebugLogs": true,
    "security.workspace.trust.enabled": false, // Disable trusted workspaces.
  };

  fs.ensureDirSync(path.dirname(settingsFile));
  fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, undefined, 4));
  return userDataDirectory;
}

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to the extension test runner script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    // The path to the workspace file
    const workspacePath = path.resolve("test-fixtures", "test.code-workspace");

    // Default settings for test env
    const userDataDirectory = await createSettings();

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath]
        .concat(["--skip-welcome"])
        .concat(["--disable-extensions"])
        .concat(["--skip-release-notes"])
        .concat(["--enable-proposed-api"])
        .concat(["--user-data-dir", userDataDirectory]),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
