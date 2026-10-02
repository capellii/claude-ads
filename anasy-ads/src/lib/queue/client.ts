import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const QUEUE_NAME = "ads-workflows";

export type WorkflowJobData = {
  runId: string;
  tenantId: string;
  type: "setup" | "audit" | "plan" | "report";
  payload: Record<string, unknown>;
};

export function createRedis() {
  return new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

export async function withRedis<T>(fn: (redis: Redis) => Promise<T>): Promise<T> {
  const redis = createRedis();
  try {
    await redis.connect();
    return await fn(redis);
  } finally {
    redis.disconnect();
  }
}

export async function enqueueWorkflow(data: WorkflowJobData): Promise<void> {
  const connection = createRedis();
  const queue = new Queue<WorkflowJobData>(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 60 * 60 * 24 * 7 },
      removeOnFail: { age: 60 * 60 * 24 * 30 },
    },
  });
  try {
    await queue.add(`${data.type}:${data.runId}`, data, { jobId: data.runId });
  } finally {
    await queue.close();
    connection.disconnect();
  }
}
