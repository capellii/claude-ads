import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const platformEnum = pgEnum("platform", [
  "google_ads",
  "meta",
  "linkedin",
  "tiktok",
  "microsoft",
  "amazon",
  "apple",
  "reddit",
  "pinterest",
  "snapchat",
  "x",
  "youtube",
]);

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  platformAccountId: text("platform_account_id").notNull(),
  accountName: text("account_name"),
  // Token stored in Secrets Manager — never stored here
  secretRef: text("secret_ref").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
  lastSyncAt: timestamp("last_sync_at"),
});
