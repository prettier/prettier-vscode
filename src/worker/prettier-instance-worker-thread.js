const { parentPort } = require("worker_threads");
const createWorker = require("./prettier-instance-worker");

createWorker(parentPort);
