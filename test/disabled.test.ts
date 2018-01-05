import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';
import { Prettier } from '../src/types';

const prettier = require('prettier') as Prettier;

suite('Test disabled', function() {
    test('it formats with default formatter', () => {
        return format('disable.js', workspace.workspaceFolders![1].uri).then(
            ({ result, source }) => {
                assert.notEqual(result, source); // it as been formatted.
                const prettierFormatted = prettier.format(source, {
                    parser: 'babylon',
                });
                assert.notEqual(result, prettierFormatted); // but not with prettier
            }
        );
    });
});
