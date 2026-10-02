import { redis } from "@/lib/queue/client";
import { createId } from "@paralleldrive/cuid2";

const VAULT_PREFIX = "vault:";
const VAULT_TTL = 60 * 60 * 24 * 400;

export async function storeSecret(data: Record<string, unknown>): Promise<string> {
  const id = createId();
  const key = `${VAULT_PREFIX}${id}`;
  await redis.set(key, JSON.stringify(data), "EX", VAULT_TTL);
  return key;
}

export async function getSecret(secretRef: string): Promise<Record<string, unknown> | null> {
  const raw = await redis.get(secretRef);
  if (!raw) return null;
  return JSON.parse(raw as string);
}

export async function updateSecret(secretRef: string, data: Record<string, unknown>): Promise<void> {
  const ttl = await redis.ttl(secretRef);
  await redis.set(secretRef, JSON.stringify(data), "EX", ttl > 0 ? ttl : VAULT_TTL);
}

export async function deleteSecret(secretRef: string): Promise<void> {
  await redis.del(secretRef);
}
