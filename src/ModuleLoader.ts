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
