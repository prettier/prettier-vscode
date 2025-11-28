---
applyTo: "src/test/**/*.ts"
---

# Test File Guidelines

Tests run inside a VS Code Extension Development Host using Mocha.

## Test Structure

- Use Mocha's `suite()` and `test()` functions
- Import assertions from `assert` module
- Tests interact with real VS Code APIs

## Test Fixtures

- Test fixtures are in `test-fixtures/` directory (not `src/test/`)
- Each fixture has its own `package.json` and Prettier configuration
- Use `getWorkspaceFolderUri(workspaceFolderName)` to get fixture paths
- Fixtures are added to `test.code-workspace` for the test runner

## Formatting Tests

- Use the `format()` helper to open and format documents
- Compare results with `getText()` helper for expected output
- Execute formatting via `vscode.commands.executeCommand("editor.action.formatDocument")`

## Async Patterns

- Tests are async - use `async/await`
- Use `wait()` helper when needing delays
- Prettier v3 formatting is async, may need retries for timing

## Test File Naming

- Name test files as `*.test.ts`
- Group related tests in the same file (e.g., `format.test.ts`, `plugins.test.ts`)
