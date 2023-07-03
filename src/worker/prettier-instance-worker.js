const path2ModuleCache = new Map();

function requireInstance(modulePath) {
  let prettierInstance = path2ModuleCache.get(modulePath);
  if (!prettierInstance) {
    prettierInstance = require(modulePath);
    if (!prettierInstance.format) {
      throw new Error("wrong instance");
    }
    path2ModuleCache.set(modulePath, prettierInstance);
  }
  return prettierInstance;
}

function normalizeResult(methodName, id, result) {
  // For prettier-vscode, `languages` are enough
  if (methodName === "getSupportInfo") {
    result = { languages: result.languages };
  }
  return {
    type: "callMethod",
    payload: { result, id, isError: false },
  };
}

module.exports = (parentPort) => {
  parentPort.on("message", ({ type, payload }) => {
    switch (type) {
      case "import": {
        const { modulePath } = payload;
        try {
          const prettierInstance = requireInstance(modulePath);
          parentPort.postMessage({
            type,
            payload: { version: prettierInstance.version },
          });
        } catch {
          parentPort.postMessage({
            type,
            payload: { version: null },
          });
        }
        break;
      }
      case "callMethod": {
        const { modulePath, methodName, methodArgs, id } = payload;
        const postError = (error) => {
          parentPort.postMessage({
            type,
            payload: {
              result: error && error.stack ? error.stack.toString() : error,
              id,
              isError: true,
            },
          });
        };
        let prettierInstance = path2ModuleCache.get(modulePath);
        if (!prettierInstance) {
          try {
            prettierInstance = requireInstance(modulePath);
          } catch (error) {
            postError(error);
          }
        }
        let result;
        try {
          result = prettierInstance[methodName](...methodArgs);
        } catch (error) {
          postError(error);
        }
        if (result instanceof Promise) {
          result.then(
            (value) => {
              try {
                parentPort.postMessage(normalizeResult(methodName, id, value));
              } catch (error) {
                postError(error);
              }
            },
            (reason) => {
              postError(reason);
            }
          );
          break;
        }
        try {
          parentPort.postMessage(normalizeResult(methodName, id, result));
        } catch (error) {
          postError(error);
        }
        break;
      }
    }
  });
};
