import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const prospects = pgTable("prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id),
  businessName: text("business_name").notNull(),
  url: text("url"),
  contactInfo: text("contact_info"),
  niche: text("niche"),
  painPoints: jsonb("pain_points"),
  proposedSolutions: jsonb("proposed_solutions"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
