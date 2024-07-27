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

parentPort.on("message", ({ type, id, payload }) => {
  switch (type) {
    case "import": {
      const { modulePath } = payload;
      try {
        const prettierInstance = requireInstance(modulePath);
        parentPort.postMessage({
          type,
          id,
          payload: { version: prettierInstance.version },
        });
      } catch {
        parentPort.postMessage({
          type,
          id,
          payload: { version: null },
        });
      }
      break;
    }
    case "callMethod": {
      const { modulePath, methodName, methodArgs } = payload;
      const postError = (error) => {
        parentPort.postMessage({
          type,
          id,
          payload: { result: error, isError: true },
        });
      };
      const postResult = (result) => {
        parentPort.postMessage({
          type,
          id,
          payload: { result, isError: false },
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
              postResult(value);
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
        postResult(result);
      } catch (error) {
        postError(error);
      }
      break;
    }
  }
});
