import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const runTypeEnum = pgEnum("run_type", [
  "setup",
  "audit",
  "plan",
  "create",
  "monitor",
  "optimize",
  "experiment",
  "report",
]);

export const runStatusEnum = pgEnum("run_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "partial",
]);

export const runs = pgTable("runs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: runTypeEnum("type").notNull(),
  status: runStatusEnum("status").notNull().default("queued"),
  s3Key: text("s3_key"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});
