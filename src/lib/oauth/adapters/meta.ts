export const META_SCOPES = [
  "ads_read",
  "ads_management",
  "business_management",
  "read_insights",
];

export function getMetaOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta`,
    scope: META_SCOPES.join(","),
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

export async function exchangeMetaCode(code: string): Promise<{
  access_token: string;
  token_type: string;
}> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/meta`,
    code,
  });
  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?${params}`
  );
  if (!res.ok) throw new Error(`Meta token exchange failed: ${res.status}`);
  return res.json();
}
