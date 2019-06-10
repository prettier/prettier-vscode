import * as assert from 'assert';
import { format } from './format.test';

suite('Test ignore', function() {
    test('it does not format file', () => {
        return format('fileToIgnore.js').then(({ result, source }) => {
            assert.strictEqual(result, source);
        });
    });

    test('it does not format subfolder/*', () => {
        return format('ignoreMe2/index.js').then(({ result, source }) => {
            assert.strictEqual(result, source);
        });
    });

    test('it does not format sub-subfolder', () => {
        return format('ignoreMe/subdir/index.js').then(({ result, source }) => {
            assert.strictEqual(result, source);
        });
    });
});
