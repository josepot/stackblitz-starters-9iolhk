// src/worker.ts
import { toHex } from "@unstoppablejs/utils";
import { parentPort, workerData } from "node:worker_threads";
var { randomBytes } = await import("node:crypto");
var RESULT_SIZE = workerData.resultSize;
var dataToSend = Array(RESULT_SIZE).fill(null).map(() => toHex(randomBytes(100)));
var createJsonRpcSubscriptionMessage = (subscription, event, value) => JSON.stringify({
  jsonrpc: "2.0",
  params: { subscription, result: { event, value } }
});
var nonBatchedMessages = dataToSend.map(
  (value) => createJsonRpcSubscriptionMessage(1, "item", value)
);
var BATCH_SIZE = workerData.batchSize;
var batchedMessages = [];
for (let i = 0; i < dataToSend.length; i += BATCH_SIZE)
  batchedMessages.push(
    createJsonRpcSubscriptionMessage(
      2,
      "items",
      dataToSend.slice(i, i + BATCH_SIZE)
    )
  );
var start = 0;
var end = 0;
await new Promise((res) => {
  parentPort?.once("message", () => {
    res();
    start = Date.now();
    nonBatchedMessages.forEach((message) => {
      parentPort?.postMessage(message);
    });
    parentPort?.postMessage(createJsonRpcSubscriptionMessage(1, "done", ""));
  });
});
await new Promise((res) => {
  parentPort?.once("message", () => {
    end = Date.now();
    res();
  });
});
console.log(`non batched took ${end - start}`);
await new Promise((res) => {
  parentPort?.once("message", () => {
    res();
    start = Date.now();
    batchedMessages.forEach((message) => {
      parentPort?.postMessage(message);
    });
    parentPort?.postMessage(createJsonRpcSubscriptionMessage(2, "done", ""));
  });
});
await new Promise((res) => {
  parentPort?.once("message", () => {
    end = Date.now();
    res();
  });
});
console.log(`batched took ${end - start}`);
parentPort?.close();
//# sourceMappingURL=worker.js.map
