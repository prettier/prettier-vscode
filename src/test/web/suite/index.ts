// Web extension test suite entry point
// This file is bundled by webpack for browser execution

// Import mocha for browser
import "mocha/mocha";

declare function require(module: string): unknown;

export function run(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Setup mocha for browser
    mocha.setup({
      ui: "tdd",
      reporter: undefined,
    });

    // Import all test files
    // These are bundled by webpack at build time
    importAll(
      (require as unknown as { context: RequireContext }).context(
        ".",
        true,
        /\.test\.ts$/,
      ),
    );

    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      reject(err);
    }
  });
}

// Webpack require.context types
interface RequireContext {
  (
    path: string,
    deep?: boolean,
    filter?: RegExp,
  ): {
    keys(): string[];
    <T>(id: string): T;
  };
}

function importAll(r: ReturnType<RequireContext>) {
  r.keys().forEach(r);
}
