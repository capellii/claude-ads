import { createId } from "@paralleldrive/cuid2";
import { cookies } from "next/headers";

const COOKIE_NAME = "__anasy_oauth_state";
const COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export function generateState(): string {
  return createId();
}

export async function setOAuthState(state: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function validateOAuthState(state: string): Promise<boolean> {
  const store = await cookies();
  const stored = store.get(COOKIE_NAME)?.value;
  store.delete(COOKIE_NAME);
  return Boolean(stored && stored === state);
}
