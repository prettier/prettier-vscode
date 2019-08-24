import * as path from 'path';
// tslint:disable-next-line: no-implicit-dependencies
import { runTests } from 'vscode-test';

(async function main() {
  // The folder containing the Extension Manifest package.json
  // Passed to `--extensionDevelopmentPath`
  const extensionDevelopmentPath = process.cwd();

  // The path to test runner
  // Passed to --extensionTestsPath
  const extensionTestsPath = path.join(__dirname, './suite');

  // The path to the workspace file
  const workspace = path.resolve('test-fixtures', 'test.code-workspace');

  // Download VS Code, unzip it and run the integration test
  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [workspace, '--disable-extensions']
  });
  // tslint:disable-next-line: no-console
})().catch(err => console.log(err));
