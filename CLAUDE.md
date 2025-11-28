# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the official Prettier VS Code extension (`prettier.prettier-vscode`). It provides code formatting using Prettier for Visual Studio Code, supporting JavaScript, TypeScript, CSS, HTML, Vue, and many other languages.

## Common Commands

```bash
# Install dependencies
pnpm install

# Build for development
pnpm compile

# Build for production
pnpm package

# Watch mode (esbuild + TypeScript type checking)
pnpm watch

# Run linting
pnpm lint

# Format code with Prettier
pnpm prettier

# Run tests (requires no VS Code instance running)
pnpm test

# Run web extension tests (headless browser)
pnpm test:web

# Compile tests only
pnpm test-compile
```

## Running Tests

### Desktop Tests

Tests require the `test-fixtures/` workspace and run inside a VS Code instance:

1. **Via VS Code Debug**: Open Debug sidebar → "Launch Tests"
2. **Via CLI**: `pnpm test` (no VS Code instance can be running)

Before running tests, `pnpm pretest` installs dependencies in various test fixture directories.

### Web Extension Tests

Web tests run in a headless Chromium browser to verify the web extension works correctly:

```bash
pnpm test:web
```

Web tests are located in `src/test/web/suite/` and test the extension's browser functionality.

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

esbuild produces two bundles:

- Node bundle (`dist/extension.js`) for desktop VS Code
- Web bundle (`dist/web-extension.js`) for vscode.dev/browser

The browser build uses path aliasing to swap `ModuleResolver` → `BrowserModuleResolver`.

Build configuration is in `esbuild.js`.

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
