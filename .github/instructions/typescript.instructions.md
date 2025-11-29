---
applyTo: "src/**/*.ts"
---

# TypeScript Source Guidelines

This is a VS Code extension. Follow these patterns:

## Imports

- Import VS Code API from `vscode` module: `import { commands, workspace, window } from "vscode"`
- Use named imports, not namespace imports
- Group imports: vscode first, then node modules, then local modules

## VS Code Extension Patterns

- Use `ExtensionContext.subscriptions` to register disposables for cleanup
- Access settings via `workspace.getConfiguration("prettier")`
- Use `LoggingService` for all logging (not console.log)
- Commands are registered via `commands.registerCommand()`

## Class Patterns

- Services follow dependency injection pattern (pass dependencies via constructor)
- Key services: `LoggingService`, `ModuleResolver`, `PrettierEditService`, `StatusBar`
- Use `Disposable` interface for cleanup

## Prettier Integration

- Support both Prettier v2 and v3+ via `PrettierInstance` interface
- `PrettierMainThreadInstance` loads directly
- Module resolution: local install → global install → bundled Prettier
- Handle `.prettierrc`, `.prettierignore`, and `package.json` prettier config

## Error Handling

- Log errors through `LoggingService`
- Show user-facing errors via `window.showErrorMessage()`
- Handle Workspace Trust restrictions appropriately
