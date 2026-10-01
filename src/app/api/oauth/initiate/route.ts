import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { generateState, setOAuthState } from "@/lib/oauth/state";
import { getGoogleOAuthUrl } from "@/lib/oauth/adapters/google-ads";
import { getMetaOAuthUrl } from "@/lib/oauth/adapters/meta";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const platform = req.nextUrl.searchParams.get("platform");

  let oauthUrl: string;
  if (platform === "google_ads") {
    const state = generateState();
    await setOAuthState(state);
    oauthUrl = getGoogleOAuthUrl(state);
  } else if (platform === "meta") {
    const state = generateState();
    await setOAuthState(state);
    oauthUrl = getMetaOAuthUrl(state);
  } else {
    return new Response("Invalid platform", { status: 400 });
  }

  redirect(oauthUrl);
}
