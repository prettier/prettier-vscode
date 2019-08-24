import * as assert from 'assert';
import { format } from './format.test';

const testConfig = (filePath: string) => {
  return async () => {
    const { result } = await format('config', filePath);
    assert.equal(
      result,
      `function foo() {
   console.log("test");
}
`
    );
  };
};

suite('Test configurations', function() {
  this.timeout(10000);
  test('it uses config from .prettierrc file ', testConfig('rcfile/test.js'));
  test(
    'it uses config from prettier.config.js file ',
    testConfig('jsconfigfile/test.js')
  );
  test(
    'it uses config from .prettierrc.js file ',
    testConfig('jsfile/test.js')
  );
});
