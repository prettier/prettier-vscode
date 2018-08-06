import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

suite('Test tslint', function() {
    test('it formats with prettier-tslint', () => {
        return format('withTslint.ts', workspace.workspaceFolders![3].uri).then(
            ({ result, source }) => {
                assert.equal(
                    result,
                    `// Settings (tslint): single-quote, trailing-comma, no-semi
function foo() {
  return 'bar'
}
`
                );
            }
        );
    });
});
