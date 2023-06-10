const { parentPort } = require("worker_threads");

const path2ModuleCache = new Map();

parentPort.on("message", ({ type, payload }) => {
  switch (type) {
    case "import": {
      const { modulePath } = payload;
      let prettierInstance = path2ModuleCache.get(modulePath);
      if (!prettierInstance) {
        try {
          prettierInstance = require(modulePath);
          // If the instance is missing `format`, it's probably
          // not an instance of Prettier
          if (!prettierInstance.format) {
            parentPort.postMessage({
              type,
              payload: { version: null },
            });
            break;
          }
          path2ModuleCache.set(modulePath, prettierInstance);
        } catch {
          parentPort.postMessage({
            type,
            payload: { version: null },
          });
          break;
        }
      }
      parentPort.postMessage({
        type,
        payload: { version: prettierInstance.version },
      });
      break;
    }
    case "callMethod": {
      const { modulePath, methodName, methodArgs, id } = payload;
      const prettierInstance = path2ModuleCache.get(modulePath);
      if (!prettierInstance) {
        parentPort.postMessage({
          type,
          payload: {
            result: new Error(
              "Cannot load prettier instance from cache. Please call import() before call callMethod."
            ),
            id,
            isError: true,
          },
        });
        break;
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
              payload: { resuslt: reason, id, isError: true },
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
