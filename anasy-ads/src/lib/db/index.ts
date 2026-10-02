import { cache } from "react";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function createDb(max = 1) {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;

// Workers forbid reusing a socket across requests, so each request gets its own client.
export const getDb = cache(() => createDb());

export * from "./schema";
