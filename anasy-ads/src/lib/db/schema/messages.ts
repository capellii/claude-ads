import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);

export const threads = pgTable("threads", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  threadId: text("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments").default([]),
  linkedRunId: text("linked_run_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
