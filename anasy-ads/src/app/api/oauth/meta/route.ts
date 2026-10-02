import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { validateOAuthState } from "@/lib/oauth/state";
import { exchangeMetaCode } from "@/lib/oauth/adapters/meta";
import { storeSecret } from "@/lib/vault";
import { getDb, accounts } from "@/lib/db";
import { getCurrentTenant } from "@/lib/db/tenant";

const back = (query: string) => `/dashboard/connections?${query}`;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam) {
    redirect(back(`error=${encodeURIComponent(errorParam)}&platform=meta`));
  }

  if (!code || !state) {
    redirect(back("error=missing_params&platform=meta"));
  }

  if (!(await validateOAuthState(state))) {
    redirect(back("error=invalid_state&platform=meta"));
  }

  let failed = false;
  try {
    const tenant = await getCurrentTenant({ create: true });
    if (!tenant) throw new Error("No authenticated tenant");

    const tokens = await exchangeMetaCode(code);

    const userInfoRes = await fetch("https://graph.facebook.com/v21.0/me?fields=id,name", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) throw new Error(`Meta /me failed: ${userInfoRes.status}`);
    const userInfo = (await userInfoRes.json()) as { id: string; name?: string };

    const secretRef = await storeSecret({
      platform: "meta",
      access_token: tokens.access_token,
      token_type: tokens.token_type,
    });

    await getDb()
      .insert(accounts)
      .values({
        tenantId: tenant.id,
        platform: "meta",
        platformAccountId: userInfo.id,
        accountName: userInfo.name ?? null,
        secretRef,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [accounts.tenantId, accounts.platform, accounts.platformAccountId],
        set: { secretRef, accountName: userInfo.name ?? null, isActive: true, connectedAt: new Date() },
      });
  } catch (err) {
    console.error("[oauth/meta]", err);
    failed = true;
  }

  redirect(back(failed ? "error=exchange_failed&platform=meta" : "success=meta"));
}
