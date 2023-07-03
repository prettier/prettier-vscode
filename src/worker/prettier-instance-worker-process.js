const createWorker = require("./prettier-instance-worker");

const parentPort = {
  on: (evt, fn) => {
    if (evt === "message") {
      process.on(evt, fn);
      return;
    }
    throw new Error(`Unsupported event ${evt}.`);
  },
  postMessage(msg) {
    process.send(msg);
  },
};

createWorker(parentPort);
