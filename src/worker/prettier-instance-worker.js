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
  log("Receive message " + JSON.stringify({ type, payload }));
  try {
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
        log("callMethod with " + JSON.stringify(payload));
        if (!allowedMethodNames.has(methodName)) {
          sendError(`Method ${methodName} cannot be called in worker.`);
          break;
        }
        const prettierInstance = path2ModuleCache.get(modulePath);
        if (!prettierInstance) {
          sendError(`Module patth ${modulePath} has not been imported.`);
          break;
        }
        let result;
        try {
          result = prettierInstance[methodName](...methodArgs);
        } catch (error) {
          log(
            "callMethod (" + methodName + ") failed " + JSON.stringify(value)
          );
          parentPort.postMessage({
            type,
            payload: { result: error, id, isError: false },
          });
        }
        if (result instanceof Promise) {
          result.then(
            (value) => {
              try {
                log(
                  "callMethod (" +
                    methodName +
                    ") promise fullfilled " +
                    JSON.stringify(value)
                );
                // For prettier-vscode, `languages` are enough
                if (methodName === "getSupportInfo") {
                  value = { languages: value.languages };
                }
                parentPort.postMessage({
                  type,
                  payload: { result: value, id, isError: false },
                });
              } catch (error) {
                log(`error call method promise
                error.name    ${error.name}
                error.message ${error.message}
                error.stack   ${error.stack}`);
              }
            },
            (reason) => {
              log(
                "callMethod (" +
                  methodName +
                  ") promise rejected " +
                  JSON.stringify(value)
              );
              parentPort.postMessage({
                type,
                payload: { resuslt: reason, id, isError: true },
              });
            }
          );
          break;
        }
        log("callMethod (" + methodName + ") result " + JSON.stringify(result));
        try {
          if (methodName === "getSupportInfo") {
            result = { languages: result.languages };
          }
          parentPort.postMessage({
            type,
            payload: { result, id, isError: false },
          });
        } catch (error) {
          log(`error callmethod non promise
  error.name    ${error.name}
  error.message ${error.message}
  error.stack   ${error.stack}`);
        }
        break;
      }
      default:
        sendError(`Type ${type} isn't supported`);
    }
  } catch (error) {
    log(`error root
  error.name    ${error.name}
  error.message ${error.message}
  error.stack   ${error.stack}`);
  }
});
