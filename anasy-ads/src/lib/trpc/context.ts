import { getDb } from "@/lib/db";
import { getCurrentTenant, getTenantKey } from "@/lib/db/tenant";

export async function createContext() {
  const ident = await getTenantKey();
  const tenant = ident ? await getCurrentTenant() : null;

  return {
    userId: ident?.userId ?? null,
    orgId: ident?.orgId ?? null,
    tenantId: tenant?.id ?? null,
    db: getDb(),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
