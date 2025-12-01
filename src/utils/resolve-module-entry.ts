import { createRequire } from "module";
import { readFileSync } from "fs";
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
  // Read the package name from the module's package.json
  const pkgPath = path.join(modulePath, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const moduleName = pkg.name;

  // Create require from inside the module directory to resolve itself
  const fakeModuleFile = path.join(modulePath, "index.js");
  const require = createRequire(pathToFileURL(fakeModuleFile).href);
  return require.resolve(moduleName);
}
