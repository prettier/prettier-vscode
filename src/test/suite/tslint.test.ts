import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

const expectedResult = `// Settings (tslint): single-quote, trailing-comma, no-semi
function foo() {
  return 'bar'
}
`;

const workspaceFolder = workspace.workspaceFolders![3].uri;

suite('Test tslint', () => {
    test('it formats with prettier-tslint', () => {
        return format('withTslint.ts', workspaceFolder).then(({ result }) => {
            assert.strictEqual(result, expectedResult);
        });
    });
});
