const { parentPort } = require("worker_threads");

function sendError(message, error) {
  parentPort.postMessage({ type: "error", payload: { message, error } });
}

function nodeModuleLoader() {
  return typeof __webpack_require__ === "function"
    ? __non_webpack_require__
    : require;
}
function loadNodeModule(modulePath) {
  try {
    return nodeModuleLoader(moduleName);
  } catch (error) {
    sendError(`Error loading node module '${modulePath}'`, error);
  }
  return undefined;
}

const path2ModuleCache = new Map();

const allowedMethodNames = new Set(["getSupportInfo", "getFileInfo", "format"]);

parentPort.on("message", ({ type, payload }) => {
  switch (type) {
    case "import": {
      const { modulePath } = payload;
      let prettierInstance = path2ModuleCache.get(modulePath);
      if (!prettierInstance) {
        prettierInstance = loadNodeModule(modulePath);
        path2ModuleCache.set(modulePath, prettierInstance);
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
      parentPort.postMessage({ type, payload: { result, id } });
      break;
    }
    default:
      sendError(`Type ${type} isn't supported`);
  }
});
