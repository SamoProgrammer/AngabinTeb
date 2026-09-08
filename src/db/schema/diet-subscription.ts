import { pgTable, text, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { users } from "./identity";
import { clinicalRegistries } from "./clinical-registry";

export const dietSubscriptions = pgTable("diet_subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // 18 categories: weight, pregnancy, lactation, diabetes, etc.
  planTier: text("plan_tier").notNull(), // bronze | silver | gold | vip
  price: numeric("price", { precision: 12, scale: 0 }).notNull(),
  status: text("status").notNull().default("pending_registry"), // pending_registry | formulating | active | completed
  registryId: text("registry_id").references(() => clinicalRegistries.id),
  mealPlanNotes: text("meal_plan_notes"),
  mealPlanPdfUrl: text("meal_plan_pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weightLogs = pgTable("weight_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1 }).notNull(),
  loggedAt: date("logged_at").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
