import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

suite('Test tslint', function() {
    this.timeout(10000);
    test('it formats with prettier-tslint', async () => {
        const { result } = await format(
            'withTslint.ts',
            workspace.workspaceFolders![3].uri
        );
        assert.equal(
            result,
            `// Settings (tslint): single-quote, trailing-comma, no-semi
function foo() {
  return 'bar'
}
`
        );
    });
});
