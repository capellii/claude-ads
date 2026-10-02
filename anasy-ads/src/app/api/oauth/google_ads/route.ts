import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { validateOAuthState } from "@/lib/oauth/state";
import { exchangeGoogleCode } from "@/lib/oauth/adapters/google-ads";
import { storeSecret } from "@/lib/vault";
import { db, accounts } from "@/lib/db";
import { upsertTenant } from "@/lib/db/tenant";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    redirect("/dashboard/connections?error=no_org");
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam) {
    redirect(`/dashboard/connections?error=${errorParam}`);
  }

  if (!code || !state) {
    redirect("/dashboard/connections?error=missing_params");
  }

  const valid = await validateOAuthState(state);
  if (!valid) {
    redirect("/dashboard/connections?error=invalid_state");
  }

  try {
    const tokens = await exchangeGoogleCode(code);

    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    if (!userInfoRes.ok) throw new Error("Failed to fetch Google user info");
    const userInfo = await userInfoRes.json() as { sub: string; email: string; name: string };

    const clerk = await clerkClient();
    const org = await clerk.organizations.getOrganization({ organizationId: orgId });
    const tenant = await upsertTenant(orgId, org.name);

    const secretRef = await storeSecret({
      platform: "google_ads",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      scope: "adwords",
    });

    await db
      .insert(accounts)
      .values({
        tenantId: tenant.id,
        platform: "google_ads",
        platformAccountId: userInfo.sub,
        accountName: userInfo.email,
        secretRef,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [accounts.tenantId, accounts.platform, accounts.platformAccountId],
        set: {
          secretRef,
          accountName: userInfo.email,
          isActive: true,
          connectedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[oauth/google_ads]", err);
    redirect("/dashboard/connections?error=exchange_failed");
  }

  redirect("/dashboard/connections?success=google_ads");
}
