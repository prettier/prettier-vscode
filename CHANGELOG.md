## [Unreleased]

## 1.0.0 (August 4, 2019)

- Fork `https://github.com/prettier/prettier-vscode` (1.8.1).
- Overall project cleanup.
- Replace NPM with Yarn.
- Change `rootDir` from `.` to `src` in `tsconfig.json`.
- Refactor `package.json`, fix all descriptions, add more parsers to `prettier.parser` and set default parser to `none`.

### Dependencies

- Update all dependencies across whole project including Prettier to [1.18.2](https://prettier.io/blog/2019/06/06/1.18.0.html) and fix vulnerability issues.
- Remove `vscode` dependency and add `@types/vscode` with `vscode-test`, this is a new approach for extension usage [#70175](https://github.com/microsoft/vscode/issues/70175).
- Add `glob` and `@types/glob` dependencies for `mocha` tests.
- Remove `cross-env` dependency because it's unnecessary since we are using now `vscode-test`.

### Scripts

- Create `watch` script for `tsc --watch` and use `compile` script only for compiling with `tsc` without `--watch` flag.
- Create `pretest` script to compile and install dependencies.
- Refactor `test` script to run `./out/test/runTest.js` instead of `./node_modules/vscode/bin/test`.
- Remove `version` script.

### Tests

- Replace Travis with Azure Pipelines.
- Replace `assert.equal` (deprecated) to `assert.strictEqual`.
- Refactor `format()` in `format.test.ts` to properly reject if Thenable rejected.
- Minor refactor for `eslint`, `ignore` and `tslint` tests.
- Refactor and fix tslint (`testTslint`) and eslint (`testEslint`) configs.
