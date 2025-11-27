# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the official Prettier VS Code extension (`esbenp.prettier-vscode`). It provides code formatting using Prettier for Visual Studio Code, supporting JavaScript, TypeScript, CSS, HTML, Vue, and many other languages.

## Common Commands

```bash
# Install dependencies
yarn install

# Build for development
yarn webpack

# Build for production
yarn vscode:prepublish

# Watch mode (TypeScript only, without webpack)
yarn watch

# Watch mode (webpack)
yarn webpack-dev

# Run linting
yarn lint

# Format code with Prettier
yarn prettier

# Run tests (requires no VS Code instance running)
yarn test

# Compile tests only
yarn test-compile
```

## Running Tests

Tests require the `test-fixtures/` workspace and run inside a VS Code instance:

1. **Via VS Code Debug**: Open Debug sidebar → "Launch Tests"
2. **Via CLI**: `yarn test` (no VS Code instance can be running)

Before running tests, `yarn pretest` installs dependencies in various test fixture directories.

## Architecture

### Entry Points

- **Desktop**: `src/extension.ts` → bundled to `dist/extension.js`
- **Browser**: Same entry, bundled to `dist/web-extension.js` (uses `BrowserModuleResolver` instead of `ModuleResolver`)

### Core Components

**Extension Activation** (`src/extension.ts`):

- Creates `ModuleResolver`, `PrettierEditService`, and `StatusBar`
- Registers formatting commands and disposables

**PrettierEditService** (`src/PrettierEditService.ts`):

- Registers VS Code document formatting providers
- Handles format document/selection requests
- Watches for config file changes (`.prettierrc`, `package.json`, etc.)
- Builds language selectors based on Prettier's supported languages + plugins

**ModuleResolver** (`src/ModuleResolver.ts`):

- Resolves local/global Prettier installations
- Falls back to bundled Prettier if none found
- Caches resolved modules and configurations
- Handles Workspace Trust restrictions

**Prettier Instance Wrappers**:

- `PrettierWorkerInstance.ts`: Runs Prettier v3+ in a worker thread for async formatting
- `PrettierMainThreadInstance.ts`: Runs Prettier v2 synchronously on main thread
- Worker script lives in `src/worker/prettier-instance-worker.js`

### Bundling

Webpack produces two bundles:

- Node bundle (`dist/extension.js`) for desktop VS Code
- Web bundle (`dist/web-extension.js`) for vscode.dev/browser

The browser build uses path aliasing to swap `ModuleResolver` → `BrowserModuleResolver`.

## Test Fixtures

Test fixtures in `test-fixtures/` each have their own `package.json` and Prettier configurations:

- `project/` - Main test project with format test files
- `plugins/`, `v3-plugins/` - Plugin testing
- `v3/` - Prettier v3 specific tests
- `outdated/` - Outdated Prettier version testing

The `.do-not-use-prettier-vscode-root` marker file stops the module resolver from searching above the test fixtures directory.

## Key Extension Settings

Configuration in `package.json` contributes settings prefixed with `prettier.`:

- `prettier.enable` - Enable/disable extension
- `prettier.requireConfig` - Require a config file to format
- `prettier.configPath` - Custom config file path
- `prettier.prettierPath` - Custom Prettier module path
- `prettier.resolveGlobalModules` - Allow global module resolution
