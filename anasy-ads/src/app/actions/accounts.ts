"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, tenants } from "@/lib/db/schema";
import { deleteSecret } from "@/lib/vault";

export async function disconnectAccount(accountId: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId),
  });
  if (!tenant) throw new Error("Tenant not found");

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
