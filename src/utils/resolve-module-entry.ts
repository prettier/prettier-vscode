import { createRequire } from "module";
import { pathToFileURL } from "url";
import * as path from "path";

/**
 * Resolve a module specifier from a directory.
 * Uses Node's built-in module resolution which handles:
 * - package.json "exports" field (ESM packages like Prettier v3)
 * - package.json "main" field (CJS packages like Prettier v2)
 * - Fallback to index.js
 */
export function resolveModuleEntry(
  fromDirectory: string,
  moduleName: string,
): string {
  // Create a require function rooted in the target directory
  // We use a fake file path since createRequire needs a file, not a directory
  const fakeFile = path.join(fromDirectory, "noop.js");
  const require = createRequire(pathToFileURL(fakeFile).href);
  return require.resolve(moduleName);
}
