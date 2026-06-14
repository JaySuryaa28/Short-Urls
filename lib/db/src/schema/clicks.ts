import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { urlsTable } from "./urls";

export const clicksTable = pgTable(
  "clicks",
  {
    id: serial("id").primaryKey(),
    urlId: integer("url_id")
      .notNull()
      .references(() => urlsTable.id, { onDelete: "cascade" }),
    deviceType: text("device_type"),
    browser: text("browser"),
    os: text("os"),
    country: text("country"),
    city: text("city"),
    referrer: text("referrer"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("clicks_url_id_idx").on(table.urlId),
    index("clicks_created_at_idx").on(table.createdAt),
  ],
);

export const insertClickSchema = createInsertSchema(clicksTable).omit({
  id: true,
  createdAt: true,
});

export type InsertClick = z.infer<typeof insertClickSchema>;
export type Click = typeof clicksTable.$inferSelect;
