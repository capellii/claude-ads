import { startWorker } from "./ads-workflow";

const worker = startWorker();

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
