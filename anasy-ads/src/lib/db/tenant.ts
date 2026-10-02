import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { tenants } from "./schema";

// clerk_org_id holds the Clerk org id, or the user id for a personal workspace.
export async function getTenantKey(): Promise<{ key: string; userId: string; orgId: string | null } | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;
  return { key: orgId ?? userId, userId, orgId: orgId ?? null };
}

async function tenantDisplayName(userId: string, orgId: string | null): Promise<string> {
  const clerk = await clerkClient();
  if (orgId) {
    const org = await clerk.organizations.getOrganization({ organizationId: orgId });
    return org.name;
  }
  const user = await clerk.users.getUser(userId);
  return user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Workspace pessoal";
}

export async function getCurrentTenant(opts: { create?: boolean } = {}) {
  const ident = await getTenantKey();
  if (!ident) return null;

  const db = getDb();
  const existing = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, ident.key),
  });
  if (existing || !opts.create) return existing ?? null;

  const name = await tenantDisplayName(ident.userId, ident.orgId);
  const [tenant] = await db
    .insert(tenants)
    .values({ clerkOrgId: ident.key, name })
    .onConflictDoUpdate({ target: tenants.clerkOrgId, set: { updatedAt: new Date() } })
    .returning();
  return tenant;
}
