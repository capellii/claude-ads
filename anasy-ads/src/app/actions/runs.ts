"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { accounts, runs } from "@/lib/db/schema";
import { getCurrentTenant } from "@/lib/db/tenant";
import { enqueueWorkflow, type WorkflowJobData } from "@/lib/queue/client";

type RunType = WorkflowJobData["type"];

export type CreateRunResult = { ok: true; runId: string } | { ok: false; error: string };

export async function createRun(
  type: RunType,
  accountId?: string,
  notes?: string
): Promise<CreateRunResult> {
  const tenant = await getCurrentTenant({ create: true });
  if (!tenant) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const db = getDb();

  if (accountId) {
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.tenantId, tenant.id), eq(accounts.isActive, true)));
    if (!account) return { ok: false, error: "Conta de anúncios não encontrada." };
  }

  const [run] = await db
    .insert(runs)
    .values({ tenantId: tenant.id, type, status: "queued" })
    .returning();

  try {
    await enqueueWorkflow({
      runId: run.id,
      tenantId: tenant.id,
      type,
      payload: {
        ...(accountId ? { accountId } : {}),
        ...(notes ? { notes } : {}),
      },
    });
  } catch (err) {
    console.error("[actions/createRun] enqueue failed", err);
    await db
      .update(runs)
      .set({ status: "failed", errorMessage: "Falha ao enfileirar o run." })
      .where(eq(runs.id, run.id));
    revalidatePath("/dashboard/runs");
    return { ok: false, error: "Não foi possível enfileirar o run. Tente novamente." };
  }

  revalidatePath("/dashboard/runs");
  return { ok: true, runId: run.id };
}
