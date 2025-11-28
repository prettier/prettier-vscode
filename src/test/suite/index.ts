import { glob } from "node:fs/promises";
import * as Mocha from "mocha";
import * as path from "path";

export async function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname, "..");

  for await (const file of glob("**/*.test.js", { cwd: testsRoot })) {
    mocha.addFile(path.resolve(testsRoot, file));
  }

  // To run only a single test, set this value
  // mocha.grep("<test name>");

  return new Promise((c, e) => {
    try {
      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (error) {
      e(error);
    }
  });
}
