import * as path from "path";
import { fileURLToPath } from "url";
import { runTests } from "@vscode/test-web";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
    const extensionTestsPath = path.resolve(
      __dirname,
      "../../../dist/web/test/suite/index.cjs",
    );

    await runTests({
      browserType: "chromium",
      extensionDevelopmentPath,
      extensionTestsPath,
      headless: true,
      verbose: true,
    });
  } catch (error) {
    console.error("Failed to run web tests");
    if (error instanceof Error) {
      console.error("error message: " + error.message);
      console.error("error name: " + error.name);
      console.error("error stack: " + error.stack);
    } else {
      console.error("No error object: " + JSON.stringify(error));
    }
    process.exit(1);
  }
}

main().catch((err) => console.error(err));
