// tslint:disable-next-line: no-implicit-dependencies
import * as glob from "glob";
// tslint:disable-next-line: no-implicit-dependencies
import * as Mocha from "mocha";
import * as path from "path";

export function run(
  testsRoot: string,
  cb: (error: any, failures?: number) => void
): void {
  // Create the mocha test
  const mocha = new Mocha({
    ui: "tdd"
  });
  mocha.useColors(true);

  if (process.env.AZURE_PIPELINES) {
    mocha.reporter("mocha-junit-reporter", {
      mochaFile: "./test-results.xml"
    });
  }

  glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
    if (err) {
      return cb(err);
    }

    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    try {
      // Run the mocha test
      mocha.run(failures => {
        cb(null, failures);
      });
    } catch (err) {
      cb(err);
    }
  });
}
