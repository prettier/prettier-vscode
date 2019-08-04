import * as glob from 'glob';
import * as Mocha from 'mocha';
import * as path from 'path';

export function run(testsRoot: string, cb: (error: any, failures?: number) => void): void {
  const mocha = new Mocha({
    ui: 'tdd',
    useColors: true,
    timeout: 10_000
  });

  glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
    if (err) {
      return cb(err);
    }

    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    try {
      // Run the mocha test
      mocha.run(failures => cb(null, failures));
    } catch (err) {
      cb(err);
    }
  });
}
