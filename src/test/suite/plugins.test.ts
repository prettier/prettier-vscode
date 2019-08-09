import * as assert from 'assert';
import { format } from './format.test';
import { workspace } from 'vscode';

suite('Test plugins', function() {
    test('it formats with plugins', () => {
        return format('index.php', workspace.workspaceFolders![4].uri).then(
            ({ result, source }) => {
                assert.equal(
                    result,
                    `<?php

array_map(
  function ($arg1, $arg2) use ($var1, $var2) {
    return $arg1 + $arg2 / ($var + $var2);
  },
  array(
    "complex" => "code",
    "with" => "inconsistent",
    "formatting" => "is",
    "hard" => "to",
    "maintain" => true
  )
);
`
                );
            }
        );
    });
});
