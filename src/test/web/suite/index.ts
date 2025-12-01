// Web extension test suite entry point
// This file is bundled by esbuild for browser execution

// Import mocha for browser
import "mocha/mocha";

export async function run(): Promise<void> {
  // Setup mocha before importing tests so suite/test are defined
  mocha.setup({
    ui: "tdd",
    reporter: undefined,
  });

  // Import test files dynamically after mocha.setup()
  await import("./smoke.test.js");

  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(err);
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
      reject(err);
    }
  });
}
