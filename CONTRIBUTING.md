# Contributing

Thank you for your interest in contributing to the Prettier VS Code extension! Feel free to open issues or PRs.

## Prerequisites

- [Node.js](https://nodejs.org/) (see `.nvmrc` for version)
- [pnpm](https://pnpm.io/) (v10.24.0 or later)
- [Visual Studio Code](https://code.visualstudio.com/)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/prettier/prettier-vscode.git
   cd prettier-vscode
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the extension:
   ```bash
   pnpm compile
   ```

## Development

### Common Commands

```bash
pnpm install          # Install dependencies
pnpm compile          # Build for development (esbuild + type checking)
pnpm compile:test     # Compile tests only
pnpm watch            # Build and watch for changes
pnpm lint             # Run ESLint
pnpm prettier         # Format code with Prettier
pnpm test             # Run tests
```

### Running the Extension

1. Open this repository in VS Code
2. Run `pnpm compile` to build
3. Press `F5` or go to Debug sidebar → "Run Extension"
4. A new VS Code window will open with the extension loaded

### Running Tests

Tests run inside a VS Code instance and use the `test-fixtures/` workspace.

**Desktop Tests (Via VS Code):**

1. Open this repository in VS Code
2. Go to Debug sidebar → "Launch Tests"

**Desktop Tests (Via CLI):**

```bash
pnpm test
```

> **Note:** No VS Code instance can be running when using the CLI, or tests won't start.

**Web Extension Tests:**

```bash
pnpm test:web
```

This runs the extension in a headless Chromium browser to verify the web extension works correctly.

## Code Style

- Code is formatted with Prettier (run `pnpm prettier` before committing)
- Linting is enforced with ESLint (run `pnpm lint` to check)
- Pre-commit hooks automatically format and lint staged files

## Architecture Overview

The extension has two entry points:

- **Desktop:** `src/extension.ts` → `dist/extension.js`
- **Browser:** `src/extension.ts` → `dist/web-extension.js`

Key components:

- `PrettierEditService.ts` - Handles document formatting
- `ModuleResolver.ts` - Resolves Prettier installations (local, global, or bundled)
- `PrettierInstance.ts` - Interface for Prettier, with `PrettierMainThreadInstance` and `PrettierWorkerInstance` implementations

## Submitting Changes

1. Fork the repository and create a branch for your changes
2. Make your changes and ensure tests pass (`pnpm test`)
3. Run `pnpm lint` and `pnpm prettier` to ensure code style compliance
4. Submit a pull request with a clear description of your changes

For bug fixes, please include a test case that demonstrates the fix when possible.
