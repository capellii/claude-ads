import { db } from "./index";
import { tenants } from "./schema";
import { eq } from "drizzle-orm";

/** Finds a tenant by Clerk orgId. Returns null if not found. */
export async function getTenantByOrgId(clerkOrgId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkOrgId, clerkOrgId))
    .limit(1);
  return tenant ?? null;
}

/** Upserts a tenant record. Creates it if it doesn't exist (handles race with Clerk webhook). */
export async function upsertTenant(clerkOrgId: string, name: string) {
  const [tenant] = await db
    .insert(tenants)
    .values({ clerkOrgId, name })
    .onConflictDoUpdate({
      target: tenants.clerkOrgId,
      set: { updatedAt: new Date() },
    })
    .returning();
  return tenant;
}
