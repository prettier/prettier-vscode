import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

const expectedResult = `/* stylelint: no-extra-semicolons, shorthand-property-no-redundant-values, color-hex-case */
body {
  color: #fff;
  margin: 1px;
}
`;

const workspaceFolder = workspace.workspaceFolders![4].uri;

suite('Test stylelint', () => {
  test('it formats with prettier-stylelint', () => {
    return format('withStylelint.css', workspaceFolder).then(({ result }) => {
      assert.strictEqual(result, expectedResult);
    });
  });
});
