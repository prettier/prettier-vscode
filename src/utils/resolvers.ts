import { createRequire } from "module";
import * as path from "path";
import { pathToFileURL } from "url";
import { PrettierOptions } from "../types.js";

/**
 * Resolve a module path using Node's resolution algorithm.
 * Uses createRequire with the parent path to properly resolve relative to the file.
 */
function resolveNodeModule(
  moduleName: string,
  parent: string,
): string | undefined {
  try {
    // Create a require function rooted at the parent directory
    // On Windows, createRequire needs a file:// URL for ESM compatibility
    const require = createRequire(pathToFileURL(parent).href);
    return require.resolve(moduleName);
  } catch {
    return undefined;
  }
}

/**
 * Resolve plugin package path for symlink structure dirs
 * See https://github.com/prettier/prettier/issues/8056
 */
export function resolveConfigPlugins(
  config: PrettierOptions,
  fileName: string,
): PrettierOptions {
  if (config?.plugins?.length) {
    config.plugins = config.plugins.map((plugin) => {
      if (
        typeof plugin === "string" &&
        !plugin.startsWith(".") &&
        !path.isAbsolute(plugin) &&
        !plugin.startsWith("file://")
      ) {
        return resolveNodeModule(plugin, fileName) || plugin;
      }
      return plugin;
    });
  }
  return config;
}
