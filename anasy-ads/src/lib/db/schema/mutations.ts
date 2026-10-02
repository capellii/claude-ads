import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { runs } from "./runs";

export const mutationStatusEnum = pgEnum("mutation_status", [
  "draft",
  "pending_approval",
  "approved",
  "applied",
  "rolled_back",
  "rejected",
]);

export const mutations = pgTable("mutations", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  runId: text("run_id").references(() => runs.id),
  status: mutationStatusEnum("status").notNull().default("draft"),
  platform: text("platform").notNull(),
  diffBefore: jsonb("diff_before").notNull(),
  diffAfter: jsonb("diff_after").notNull(),
  description: text("description").notNull(),
  blastRadius: text("blast_radius"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  rollbackKey: text("rollback_key"),
  approvedBy: text("approved_by"),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
