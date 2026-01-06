# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the official Prettier VS Code extension (`esbenp.prettier-vscode`). It provides code formatting using Prettier for Visual Studio Code, supporting JavaScript, TypeScript, CSS, HTML, Vue, and many other languages.

## Common Commands

```bash
# Install dependencies
npm install

# Build for development
npm run compile

# Build for production
npm run package

# Watch mode (esbuild + TypeScript type checking)
npm run watch

# Run linting
npm run lint

# Format code with Prettier
npm run prettier

# Run tests (requires no VS Code instance running)
npm test

# Run web extension tests (headless browser)
npm run test:web

# Compile tests only
npm run compile:test
```

## Running Tests

### Desktop Tests

Tests require the `test-fixtures/` workspace and run inside a VS Code instance:

1. **Via VS Code Debug**: Open Debug sidebar → "Launch Tests"
2. **Via CLI**: `npm test` (no VS Code instance can be running)

Before running tests, `npm run pretest` installs dependencies in various test fixture directories.

### Web Extension Tests

Web tests run in a headless Chromium browser to verify the web extension works correctly:

```bash
npm run test:web
```

Web tests are located in `src/test/web/suite/` and test the extension's browser functionality.

## Architecture

### Entry Points

- **Desktop**: `src/extension.ts` → bundled to `dist/extension.js`
- **Browser**: Same entry, bundled to `dist/web-extension.cjs` (esbuild swaps `ModuleResolverNode.ts` → `ModuleResolverWeb.ts`)

### Core Components

**Extension Activation** (`src/extension.ts`):

- Creates `ModuleResolver`, `PrettierEditService`, and `StatusBar`
- Registers formatting commands and disposables

**PrettierEditService** (`src/PrettierEditService.ts`):

- Registers VS Code document formatting providers
- Handles format document/selection requests
- Watches for config file changes (`.prettierrc`, `package.json`, etc.)
- Builds language selectors based on Prettier's supported languages + plugins

**ModuleResolver** (`src/ModuleResolverNode.ts` for desktop, `src/ModuleResolverWeb.ts` for browser):

- **Desktop (ModuleResolverNode.ts)**: Resolves local/global Prettier installations, falls back to bundled Prettier, caches resolved modules, handles Workspace Trust
- **Browser (ModuleResolverWeb.ts)**: Uses bundled Prettier standalone with all built-in plugins

**Prettier Instance** (`src/PrettierDynamicInstance.ts`):

- Implements the `PrettierInstance` interface (defined in `src/types.ts`)
- Loads Prettier dynamically using ESM `import()` for lazy loading
- Works with both Prettier v2 and v3+

### Bundling

esbuild produces two bundles:

- Node bundle (`dist/extension.js`) for desktop VS Code
- Web bundle (`dist/web-extension.cjs`) for vscode.dev/browser

The browser build uses path aliasing to swap `ModuleResolverNode.ts` → `ModuleResolverWeb.ts`.

Build configuration is in `esbuild.mjs`.

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
