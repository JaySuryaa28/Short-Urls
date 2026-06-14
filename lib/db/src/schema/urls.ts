import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const urlsTable = pgTable(
  "urls",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    originalUrl: text("original_url").notNull(),
    shortCode: text("short_code").notNull().unique(),
    customAlias: text("custom_alias"),
    title: text("title"),
    expiresAt: timestamp("expires_at"),
    isActive: boolean("is_active").notNull().default(true),
    totalClicks: integer("total_clicks").notNull().default(0),
    lastVisitedAt: timestamp("last_visited_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("urls_user_id_idx").on(table.userId),
    index("urls_short_code_idx").on(table.shortCode),
  ],
);

export const insertUrlSchema = createInsertSchema(urlsTable).omit({
  id: true,
  totalClicks: true,
  lastVisitedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUrl = z.infer<typeof insertUrlSchema>;
export type Url = typeof urlsTable.$inferSelect;
