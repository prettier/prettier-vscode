import * as path from "path";
import { PrettierOptions } from "../types";

// Source: https://github.com/microsoft/vscode-eslint/blob/master/server/src/eslintServer.ts
export function loadNodeModule<T>(moduleName: string): T | undefined {
  try {
    return require(moduleName);
  } catch {
    throw new Error(`Error loading node module '${moduleName}'`);
  }
}

export function resolveNodeModule(
  moduleName: string,
  options?: { paths: string[] },
) {
  try {
    return require.resolve(moduleName, options);
  } catch {
    throw new Error(`Error resolving node module '${moduleName}'`);
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
        return resolveNodeModule(plugin, { paths: [fileName] }) || plugin;
      }
      return plugin;
    });
  }
  return config;
}
