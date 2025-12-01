import { createRequire } from "module";
import { pathToFileURL } from "url";
import * as path from "path";

/**
 * Resolve the entry point for a module from a package directory.
 * Uses Node's built-in module resolution which handles:
 * - package.json "exports" field (ESM packages like Prettier v3)
 * - package.json "main" field (CJS packages like Prettier v2)
 * - Fallback to index.js
 */
export function resolveModuleEntry(modulePath: string): string {
  // Create require from a fake file inside the module directory
  // This ensures resolution happens relative to the module's location
  const fakeModuleFile = path.join(modulePath, "index.js");
  const require = createRequire(pathToFileURL(fakeModuleFile).href);
  // Resolve the module name (directory name) from within that context
  const moduleName = path.basename(modulePath);
  return require.resolve(moduleName);
}
