// tslint:disable-next-line: no-implicit-dependencies
import * as glob from "glob";
// tslint:disable-next-line: no-implicit-dependencies
import * as Mocha from "mocha";
import * as path from "path";

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  if (process.env.AZURE_PIPELINES) {
    /* cspell: disable-next-line */
    mocha.reporter("mocha-junit-reporter", {
      mochaFile: "./test-results.xml",
    });
  }

  const testsRoot = path.resolve(__dirname, "..");

  return new Promise((c, e) => {
    glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err);
      }

      // Add files to the test suite
      files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

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
  });
}
