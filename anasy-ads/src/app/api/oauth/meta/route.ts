import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { validateOAuthState } from "@/lib/oauth/state";
import { exchangeMetaCode } from "@/lib/oauth/adapters/meta";
import { storeSecret } from "@/lib/vault";
import { db, accounts } from "@/lib/db";
import { upsertTenant } from "@/lib/db/tenant";

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
    const tokens = await exchangeMetaCode(code);

    const userInfoRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${tokens.access_token}`
    );
    if (!userInfoRes.ok) throw new Error("Failed to fetch Meta user info");
    const userInfo = await userInfoRes.json() as { id: string; name: string; email?: string };

    const clerk = await clerkClient();
    const org = await clerk.organizations.getOrganization({ organizationId: orgId });
    const tenant = await upsertTenant(orgId, org.name);

    const secretRef = await storeSecret({
      platform: "meta",
      access_token: tokens.access_token,
      token_type: tokens.token_type,
    });

    await db
      .insert(accounts)
      .values({
        tenantId: tenant.id,
        platform: "meta",
        platformAccountId: userInfo.id,
        accountName: userInfo.name,
        secretRef,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: [accounts.tenantId, accounts.platform, accounts.platformAccountId],
        set: {
          secretRef,
          accountName: userInfo.name,
          isActive: true,
          connectedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[oauth/meta]", err);
    redirect("/dashboard/connections?error=exchange_failed");
  }

  redirect("/dashboard/connections?success=meta");
}
