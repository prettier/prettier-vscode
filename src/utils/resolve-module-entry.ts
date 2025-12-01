import { createRequire } from "module";

/**
 * Resolve the entry point for a module from a package directory.
 * Uses Node's built-in module resolution which handles:
 * - package.json "exports" field (ESM packages like Prettier v3)
 * - package.json "main" field (CJS packages like Prettier v2)
 * - Fallback to index.js
 */
export function resolveModuleEntry(modulePath: string): string {
  const require = createRequire(import.meta.url);
  return require.resolve(modulePath);
}
