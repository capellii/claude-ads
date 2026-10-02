import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { generateState, setOAuthState } from "@/lib/oauth/state";
import { getGoogleOAuthUrl } from "@/lib/oauth/adapters/google-ads";
import { getMetaOAuthUrl } from "@/lib/oauth/adapters/meta";

const PROVIDERS = {
  google_ads: {
    configured: () => Boolean(process.env.GOOGLE_ADS_CLIENT_ID && process.env.GOOGLE_ADS_CLIENT_SECRET),
    url: getGoogleOAuthUrl,
  },
  meta: {
    configured: () => Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    url: getMetaOAuthUrl,
  },
} as const;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const platform = req.nextUrl.searchParams.get("platform");
  if (platform !== "google_ads" && platform !== "meta") {
    redirect("/dashboard/connections?error=invalid_platform");
  }

  const provider = PROVIDERS[platform];
  if (!provider.configured()) {
    redirect(`/dashboard/connections?error=not_configured&platform=${platform}`);
  }

  const state = generateState();
  await setOAuthState(state);
  redirect(provider.url(state));
}
