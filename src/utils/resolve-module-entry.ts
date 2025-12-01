import { createRequire } from "module";
import { pathToFileURL } from "url";
import * as path from "path";

/**
 * Extract the package name from a module path.
 * Handles both regular packages (e.g., "prettier") and scoped packages (e.g., "@prettier/plugin-xml").
 */
function getPackageName(modulePath: string): string {
  const baseName = path.basename(modulePath);
  const parentDir = path.basename(path.dirname(modulePath));
  // Scoped packages have a parent directory starting with "@"
  if (parentDir.startsWith("@")) {
    return `${parentDir}/${baseName}`;
  }
  return baseName;
}

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
  // Resolve the package name from within that context
  const moduleName = getPackageName(modulePath);
  return require.resolve(moduleName);
}
