import { Queue } from "bullmq";
import { Redis } from "ioredis";

export const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL!, {
  maxRetriesPerRequest: null,
});

export const adsWorkflowQueue = new Queue("ads-workflows", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 60 * 60 * 24 * 7 },
    removeOnFail: { age: 60 * 60 * 24 * 30 },
  },
});

export type WorkflowJobData = {
  runId: string;
  tenantId: string;
  type: "setup" | "audit" | "plan" | "report";
  payload: Record<string, unknown>;
};
