import * as path from "path";
import { PrettierOptions } from "./types";

declare const __webpack_require__: typeof require;
declare const __non_webpack_require__: typeof require;

export function nodeModuleLoader() {
  return typeof __webpack_require__ === "function"
    ? __non_webpack_require__
    : require;
}

// Source: https://github.com/microsoft/vscode-eslint/blob/master/server/src/eslintServer.ts
export function loadNodeModule<T>(moduleName: string): T | undefined {
  try {
    return nodeModuleLoader()(moduleName);
  } catch (error) {
    throw new Error(`Error loading node module '${moduleName}'`);
  }
}

export function resolveNodeModule(
  moduleName: string,
  options?: { paths: string[] }
) {
  try {
    return nodeModuleLoader().resolve(moduleName, options);
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
  fileName: string
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
