import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

suite('Test eslint', function() {
    this.timeout(10000);
    test('it formats with prettier-eslint', async () => {
        const { result } = await format(
            'withEslint.js',
            workspace.workspaceFolders![2].uri
        );
        return assert.equal(
            result,
            `// Settings (eslint): single-quote, trailing-comma, no-semi
function foo() {
    return 'bar'
}
`
        );
    });
});
