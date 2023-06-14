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
      let prettierInstance = path2ModuleCache.get(modulePath);
      if (!prettierInstance) {
        try {
          prettierInstance = requireInstance(modulePath);
        } catch (error) {
          parentPort.postMessage({
            type,
            payload: { result: error, id, isError: true },
          });
        }
      }
      let result;
      try {
        result = prettierInstance[methodName](...methodArgs);
      } catch (error) {
        parentPort.postMessage({
          type,
          payload: { result: error, id, isError: true },
        });
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
              parentPort.postMessage({
                type,
                payload: { result: error, id, isError: true },
              });
            }
          },
          (reason) => {
            parentPort.postMessage({
              type,
              payload: { result: reason, id, isError: true },
            });
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
        parentPort.postMessage({
          type,
          payload: { result: error, id, isError: true },
        });
      }
      break;
    }
  }
});
