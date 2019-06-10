import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

const expectedResult = `// Settings (eslint): single-quote, trailing-comma, no-semi
function foo() {
    return 'bar'
}
`;

const workspaceFolder = workspace.workspaceFolders![2].uri;

suite('Test eslint', () => {
    test('it formats with prettier-eslint', () => {
        return format('withEslint.js', workspaceFolder).then(({ result }) => {
            assert.strictEqual(result, expectedResult);
        });
    }).timeout(6000);
});
