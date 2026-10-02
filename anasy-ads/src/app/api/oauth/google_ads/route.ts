import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { validateOAuthState } from "@/lib/oauth/state";
import { exchangeGoogleCode } from "@/lib/oauth/adapters/google-ads";
import { storeSecret } from "@/lib/vault";
import { getDb, accounts } from "@/lib/db";
import { getCurrentTenant } from "@/lib/db/tenant";

const back = (query: string) => `/dashboard/connections?${query}`;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam) {
    redirect(back(`error=${encodeURIComponent(errorParam)}&platform=google_ads`));
  }

  if (!code || !state) {
    redirect(back("error=missing_params&platform=google_ads"));
  }

  if (!(await validateOAuthState(state))) {
    redirect(back("error=invalid_state&platform=google_ads"));
  }

  let failed = false;
  try {
    const tenant = await getCurrentTenant({ create: true });
    if (!tenant) throw new Error("No authenticated tenant");

    const tokens = await exchangeGoogleCode(code);

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) throw new Error(`Google userinfo failed: ${userInfoRes.status}`);
    const userInfo = (await userInfoRes.json()) as { sub: string; email?: string };

    const secretRef = await storeSecret({
      platform: "google_ads",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: "adwords",
    });

    await getDb()
      .insert(accounts)
      .values({
        tenantId: tenant.id,
        platform: "google_ads",
        platformAccountId: userInfo.sub,
        accountName: userInfo.email ?? null,
        secretRef,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [accounts.tenantId, accounts.platform, accounts.platformAccountId],
        set: { secretRef, accountName: userInfo.email ?? null, isActive: true, connectedAt: new Date() },
      });
  } catch (err) {
    console.error("[oauth/google_ads]", err);
    failed = true;
  }

  redirect(back(failed ? "error=exchange_failed&platform=google_ads" : "success=google_ads"));
}
