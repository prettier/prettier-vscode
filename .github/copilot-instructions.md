# Copilot Instructions

This is the official Prettier VS Code extension (`prettier.prettier-vscode`). It provides code formatting using Prettier for Visual Studio Code, supporting JavaScript, TypeScript, CSS, HTML, Vue, and many other languages.

## Development

- Use `npm` as the package manager
- Run `npm install` to install dependencies
- Run `npm run compile` to build for development
- Run `npm run test` to run tests (no VS Code instance can be running)
- Run `npm run lint` to check linting
- Run `npm run prettier` to format code

## Architecture

Entry points:

- Desktop: `src/extension.ts` → bundled to `dist/extension.js`
- Browser: Same entry, bundled to `dist/web-extension.js` (uses `BrowserModuleResolver` instead of `ModuleResolver`)

Core components:

- `src/extension.ts` - Extension activation (async), creates ModuleResolver, PrettierEditService, and StatusBar
- `src/PrettierEditService.ts` - Registers VS Code document formatting providers, handles format requests
- `src/ModuleResolver.ts` - Resolves local/global Prettier installations, falls back to bundled Prettier
- `src/PrettierDynamicInstance.ts` - Implements `PrettierInstance` interface, loads Prettier dynamically using ESM `import()`
- `src/types.ts` - TypeScript types including `PrettierInstance` interface

esbuild produces two bundles:

- Node bundle (`dist/extension.js`) for desktop VS Code
- Web bundle (`dist/web-extension.js`) for vscode.dev/browser

## Code Style

- Use TypeScript for all source code
- Follow existing code patterns in the codebase
- Extension settings are prefixed with `prettier.` and defined in `package.json`
- Use the VS Code extension API patterns already established in the codebase

## Testing

- Test fixtures live in `test-fixtures/` with their own `package.json` and Prettier configurations
- The `.do-not-use-prettier-vscode-root` marker file stops module resolver from searching above test fixtures
- Tests run inside a VS Code instance using the Extension Development Host

## Code Review Guidelines

When reviewing pull requests, focus on:

### Security

- No hardcoded secrets or credentials
- Workspace Trust is respected when resolving modules from untrusted workspaces
- User input is validated before use in file paths or module resolution

### VS Code Extension Best Practices

- Disposables are properly registered with `context.subscriptions` to prevent memory leaks
- Async operations handle errors appropriately
- User-facing messages go through `LoggingService` or VS Code's message APIs
- Settings changes are handled correctly (some require reload)

### Prettier Compatibility

- Changes work with both Prettier v2 (sync) and v3+ (async/worker)
- Module resolution fallback chain is maintained: local → global → bundled
- Config file watching covers all Prettier config formats

### Performance

- Avoid blocking the extension host main thread
- Prettier is loaded lazily using dynamic `import()` to minimize startup time
- Module and config resolution results are cached appropriately

### Browser Compatibility

- Code in the main bundle should work in both Node.js and browser contexts
- Browser-specific code uses `BrowserModuleResolver`
- No Node.js-only APIs in shared code paths
