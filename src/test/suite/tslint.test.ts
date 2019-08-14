import * as assert from 'assert';
import { format } from './format.test';

suite('Test tslint', function() {
    this.timeout(10000);
    test('it formats with prettier-tslint', async () => {
        const { result } = await format('tslint', 'withTslint.ts');
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
