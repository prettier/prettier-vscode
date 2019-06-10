import * as assert from 'assert';
import { format } from './format.test';

suite('Test ignore', function() {
    test('it does not format file', () =>
        format('fileToIgnore.js').then(({ result, source }) => {
            assert.equal(result, source);
        }));
    test('it does not format subfolder/*', () =>
        format('ignoreMe2/index.js').then(({ result, source }) => {
            assert.equal(result, source);
        }));
    test('it does not format sub-subfolder', () =>
        format('ignoreMe/subdir/index.js').then(({ result, source }) => {
            assert.equal(result, source);
        }));
});
