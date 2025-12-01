# Contributing

Thank you for your interest in contributing to the Prettier VS Code extension! Feel free to open issues or PRs.

## Prerequisites

- [Node.js](https://nodejs.org/) (see `.nvmrc` for version)
- [Visual Studio Code](https://code.visualstudio.com/)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/prettier/prettier-vscode.git
   cd prettier-vscode
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run compile
   ```

## Development

### Common Commands

```bash
npm install           # Install dependencies
npm run compile       # Build for development (esbuild + type checking)
npm run compile:test  # Compile tests only
npm run watch         # Build and watch for changes
npm run lint          # Run ESLint
npm run prettier      # Format code with Prettier
npm test              # Run tests
```

### Running the Extension

1. Open this repository in VS Code
2. Run `npm run compile` to build
3. Press `F5` or go to Debug sidebar → "Run Extension"
4. A new VS Code window will open with the extension loaded

### Running Tests

Tests run inside a VS Code instance and use the `test-fixtures/` workspace.

**Desktop Tests (Via VS Code):**

1. Open this repository in VS Code
2. Go to Debug sidebar → "Launch Tests"

**Desktop Tests (Via CLI):**

```bash
npm test
```

> **Note:** No VS Code instance can be running when using the CLI, or tests won't start.

**Web Extension Tests:**

```bash
npm run test:web
```

This runs the extension in a headless Chromium browser to verify the web extension works correctly.

## Code Style

- Code is formatted with Prettier (run `npm run prettier` before committing)
- Linting is enforced with ESLint (run `npm run lint` to check)
- Pre-commit hooks automatically format and lint staged files

## Architecture Overview

The extension has two entry points:

- **Desktop:** `src/extension.ts` → `dist/extension.js`
- **Browser:** `src/extension.ts` → `dist/web-extension.js`

Key components:

- `PrettierEditService.ts` - Handles document formatting
- `ModuleResolver.ts` - Resolves Prettier installations (local, global, or bundled)

## Submitting Changes

1. Fork the repository and create a branch for your changes
2. Make your changes and ensure tests pass (`npm test`)
3. Run `npm run lint` and `npm run prettier` to ensure code style compliance
4. Submit a pull request with a clear description of your changes

For bug fixes, please include a test case that demonstrates the fix when possible.
