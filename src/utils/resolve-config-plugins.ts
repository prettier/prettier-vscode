import * as path from "path";
import { PrettierOptions } from "../types";

function resolveNodeModule(moduleName: string, options?: { paths: string[] }) {
  try {
    return require.resolve(moduleName, options);
  } catch (error) {
    throw new Error(`Error resolve node module '${moduleName}'`);
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
        !path.isAbsolute(plugin)
      ) {
        return resolveNodeModule(plugin, { paths: [fileName] }) || plugin;
      }
      return plugin;
    });
  }
  return config;
}
