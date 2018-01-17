import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

suite('Test eslint', function() {
    test('it formats with prettier-eslint', () => {
        return format('withEslint.js', workspace.workspaceFolders![2].uri).then(
            ({ result, source }) => {
                assert.equal(
                    result,
                    `// Settings (eslint): single-quote, trailing-comma, no-semi
function foo() {
    return 'bar'
}
`
                ); // Expect 4 space, space before function paren and single-quote
            }
        );
    });
});
