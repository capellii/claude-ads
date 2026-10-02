import { withRedis } from "@/lib/queue/client";
import { createId } from "@paralleldrive/cuid2";

const VAULT_PREFIX = "vault:";
const VAULT_TTL = 60 * 60 * 24 * 400;

export async function storeSecret(data: Record<string, unknown>): Promise<string> {
  const key = `${VAULT_PREFIX}${createId()}`;
  await withRedis((redis) => redis.set(key, JSON.stringify(data), "EX", VAULT_TTL));
  return key;
}

export async function getSecret(secretRef: string): Promise<Record<string, unknown> | null> {
  const raw = await withRedis((redis) => redis.get(secretRef));
  return raw ? JSON.parse(raw) : null;
}

export async function updateSecret(secretRef: string, data: Record<string, unknown>): Promise<void> {
  await withRedis(async (redis) => {
    const ttl = await redis.ttl(secretRef);
    await redis.set(secretRef, JSON.stringify(data), "EX", ttl > 0 ? ttl : VAULT_TTL);
  });
}

export async function deleteSecret(secretRef: string): Promise<void> {
  await withRedis((redis) => redis.del(secretRef));
}
