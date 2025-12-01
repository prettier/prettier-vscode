import * as fs from "fs";
import * as path from "path";

/**
 * Resolve the entry point for a module from a package directory.
 * ESM doesn't support directory imports, so we need to resolve to the actual file.
 *
 * This handles:
 * - package.json "exports" field (ESM packages like Prettier v3)
 * - package.json "main" field (CJS packages like Prettier v2)
 * - Fallback to index.js
 */
export async function resolveModuleEntry(modulePath: string): Promise<string> {
  const pkgJsonPath = path.join(modulePath, "package.json");

  // Helper to check if path is a directory and append index.js if needed
  async function resolveIfDirectory(p: string): Promise<string> {
    try {
      const stat = await fs.promises.stat(p);
      if (stat.isDirectory()) {
        return path.join(p, "index.js");
      }
      return p;
    } catch {
      // If stat fails, check if adding .js extension works
      if (!p.endsWith(".js") && !p.endsWith(".mjs") && !p.endsWith(".cjs")) {
        return p + ".js";
      }
      return p;
    }
  }

  try {
    const pkgJson = JSON.parse(
      await fs.promises.readFile(pkgJsonPath, "utf8"),
    ) as {
      main?: string;
      module?: string;
      exports?: Record<string, unknown> | string;
    };

    // Check exports field first (for ESM packages like Prettier v3)
    if (pkgJson.exports) {
      if (typeof pkgJson.exports === "string") {
        return resolveIfDirectory(path.join(modulePath, pkgJson.exports));
      }
      // Handle exports object - look for "." entry
      const dotExport = pkgJson.exports["."];
      if (typeof dotExport === "string") {
        return resolveIfDirectory(path.join(modulePath, dotExport));
      }
      // Handle conditional exports like { ".": { "import": "./index.mjs", "default": "./index.js" } }
      if (dotExport && typeof dotExport === "object") {
        const entry =
          (dotExport as Record<string, string>)["import"] ||
          (dotExport as Record<string, string>)["default"] ||
          (dotExport as Record<string, string>)["require"];
        if (entry) {
          return resolveIfDirectory(path.join(modulePath, entry));
        }
      }
    }

    // Fall back to main field (for CJS packages like Prettier v2)
    if (pkgJson.main) {
      return resolveIfDirectory(path.join(modulePath, pkgJson.main));
    }

    // Default to index.js
    return path.join(modulePath, "index.js");
  } catch {
    // If we can't read package.json, try index.js
    return path.join(modulePath, "index.js");
  }
}
