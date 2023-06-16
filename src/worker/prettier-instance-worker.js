const { parentPort } = require("worker_threads");

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

function serializeError(errorObj) {
  if (errorObj instanceof Error) {
    return {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack,
    };
  }
  return errorObj;
}

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
          payload: { result: serializeError(error), id, isError: true },
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
              // For prettier-vscode, `languages` are enough
              if (methodName === "getSupportInfo") {
                value = { languages: value.languages };
              }
              parentPort.postMessage({
                type,
                payload: { result: value, id, isError: false },
              });
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
        // For prettier-vscode, `languages` are enough
        if (methodName === "getSupportInfo") {
          result = { languages: result.languages };
        }
        parentPort.postMessage({
          type,
          payload: { result, id, isError: false },
        });
      } catch (error) {
        postError(error);
      }
      break;
    }
  }
});
