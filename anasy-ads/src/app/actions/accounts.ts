"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getCurrentTenant } from "@/lib/db/tenant";
import { deleteSecret } from "@/lib/vault";

export async function disconnectAccount(accountId: string) {
  const tenant = await getCurrentTenant();
  if (!tenant) throw new Error("Unauthorized");

  const db = getDb();
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.tenantId, tenant.id)));

  if (!account) throw new Error("Account not found");

  await deleteSecret(account.secretRef);
  await db
    .update(accounts)
    .set({ isActive: false })
    .where(eq(accounts.id, accountId));

  revalidatePath("/dashboard/connections");
}
