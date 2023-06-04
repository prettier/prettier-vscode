const { parentPort } = require("worker_threads");

function sendError(message, error) {
  parentPort.postMessage({ type: "error", payload: { message, error } });
}

// function nodeModuleLoader() {
//   return typeof __webpack_require__ === "function"
//     ? __non_webpack_require__
//     : require;
// }
function loadNodeModule(modulePath) {
  try {
    return require(modulePath);
  } catch (error) {
    sendError(`Error loading node module '${modulePath}'`, error);
  }
  return undefined;
}

const path2ModuleCache = new Map();

const allowedMethodNames = new Set(["getSupportInfo", "getFileInfo", "format"]);

function log(value) {
  require("fs").appendFileSync(
    "/Users/sosuke.suzuki/ghq/github.com/sosukesuzuki/prettier-vscode/log.txt",
    "[WORKER THREAD]" + value + "\n"
  );
}

parentPort.on("message", ({ type, payload }) => {
  switch (type) {
    case "import": {
      const { modulePath } = payload;
      let prettierInstance = path2ModuleCache.get(modulePath);
      if (!prettierInstance) {
        try {
          prettierInstance = loadNodeModule(modulePath);
          // If the instance is missing `format`, it's probably
          // not an instance of Prettier
          if (!prettierInstance.format) {
            throw new Error("");
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
      if (!allowedMethodNames.has(methodName)) {
        sendError(`Method ${methodName} cannot be called in worker.`);
        break;
      }
      const prettierInstance = path2ModuleCache.get(modulePath);
      if (!prettierInstance) {
        sendError(`Module patth ${modulePath} has not been imported.`);
        break;
      }
      const result = prettierInstance[moduleName](...methodArgs);
      if (result instanceof Promise) {
        result.then((value) => {
          parentPort.postMessage({ type, payload: { result: value, id } });
        });
      } else {
        parentPort.postMessage({ type, payload: { result, id } });
      }
      break;
    }
    default:
      sendError(`Type ${type} isn't supported`);
  }
});
