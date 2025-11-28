import * as path from "path";
import { runTests } from "@vscode/test-web";

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
    const extensionTestsPath = path.resolve(
      __dirname,
      "../../../dist/web/test/suite/index.js",
    );

    await runTests({
      browserType: "chromium",
      extensionDevelopmentPath,
      extensionTestsPath,
      headless: true,
      verbose: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to run web tests");
    if (error instanceof Error) {
      // eslint-disable-next-line no-console
      console.error("error message: " + error.message);
      // eslint-disable-next-line no-console
      console.error("error name: " + error.name);
      // eslint-disable-next-line no-console
      console.error("error stack: " + error.stack);
    } else {
      // eslint-disable-next-line no-console
      console.error("No error object: " + JSON.stringify(error));
    }
    process.exit(1);
  }
}

// eslint-disable-next-line no-console
main().catch((err) => console.error(err));
