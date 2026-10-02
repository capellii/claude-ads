import { Worker, type Job } from "bullmq";
import { createRedis, QUEUE_NAME, type WorkflowJobData } from "@/lib/queue/client";
import { createDb } from "@/lib/db";
import { runs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = createDb(5);
const AI_MODEL = "claude-sonnet-4-6";

function loadSkillPrompt(): string {
  try {
    return readFileSync(join(process.cwd(), "skill-refs", "SKILL.md"), "utf-8");
  } catch {
    return "";
  }
}

function buildUserPrompt(type: string, payload: Record<string, unknown>): string {
  const notes = typeof payload.notes === "string" ? ` ${payload.notes}` : "";
  switch (type) {
    case "audit":  return `Realize uma auditoria completa da conta de anúncios conectada.${notes}`;
    case "report": return `Gere um relatório de desempenho da conta de anúncios.${notes}`;
    case "setup":  return `Analise a configuração da conta de anúncios e sugira melhorias.${notes}`;
    case "plan":   return `Elabore um plano de mídia paga baseado nos dados da conta.${notes}`;
    default:       return `Execute a operação: ${type}.${notes}`;
  }
}

async function processRun(job: Job<WorkflowJobData>): Promise<void> {
  const { runId, type, payload } = job.data;

  await db
    .update(runs)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(runs.id, runId));

  const skillPrompt = loadSkillPrompt();
  const systemBlocks = skillPrompt
    ? [{ type: "text" as const, text: skillPrompt, cache_control: { type: "ephemeral" as const } }]
    : undefined;

  const response = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 8096,
    ...(systemBlocks ? { system: systemBlocks } : {}),
    messages: [{ role: "user", content: buildUserPrompt(type, payload) }],
  });

  const result = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n");

  await db
    .update(runs)
    .set({
      status: "completed",
      completedAt: new Date(),
      metadata: {
        result,
        model: AI_MODEL,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      },
    })
    .where(eq(runs.id, runId));
}

export function startWorker() {
  const worker = new Worker<WorkflowJobData>(QUEUE_NAME, processRun, {
    connection: createRedis(),
    concurrency: 2,
  });

  worker.on("completed", (job) => {
    console.log(`[worker] ✓ run:${job.data.runId} (job:${job.id})`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[worker] ✗ run:${job?.data.runId}:`, err.message);
    if (job?.data.runId) {
      await db
        .update(runs)
        .set({ status: "failed", errorMessage: err.message })
        .where(eq(runs.id, job.data.runId))
        .catch(() => {});
    }
  });

  console.log("[worker] ads-workflow started (concurrency: 2)");
  return worker;
}
