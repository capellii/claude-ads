"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { runs, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { adsWorkflowQueue } from "@/lib/queue/client";
import { revalidatePath } from "next/cache";

type RunType = "setup" | "audit" | "plan" | "report";

export async function createRun(type: RunType, notes?: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId),
  });
  if (!tenant) throw new Error("Tenant not found");

  const [run] = await db
    .insert(runs)
    .values({ tenantId: tenant.id, type, status: "queued" })
    .returning();

  await adsWorkflowQueue.add(
    `${type}:${run.id}`,
    { runId: run.id, tenantId: tenant.id, type, payload: notes ? { notes } : {} },
    { jobId: run.id }
  );

  revalidatePath("/dashboard/runs");
  return run;
}
