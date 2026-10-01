import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(_opts: FetchCreateContextFnOptions) {
  const { userId, orgId } = await auth();

  let tenantId: string | null = null;
  if (orgId) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.clerkOrgId, orgId),
    });
    tenantId = tenant?.id ?? null;
  }

  return { userId, orgId, tenantId, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
