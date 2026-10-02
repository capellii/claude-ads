import { pgTable, text, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const planEnum = pgEnum("plan", ["free", "starter", "pro", "agency"]);

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  clerkOrgId: text("clerk_org_id").notNull().unique(),
  name: text("name").notNull(),
  plan: planEnum("plan").notNull().default("free"),
  asaasCustomerId: text("asaas_customer_id"),
  asaasSubscriptionId: text("asaas_subscription_id"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
