import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const clinicalRegistries = pgTable("clinical_registry", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("in_progress"), // in_progress | submitted | reviewed
  personInfo: jsonb("person_info"),
  medicalHistory: jsonb("medical_history"),
  drugHistory: jsonb("drug_history"),
  addictionHistory: jsonb("addiction_history"),
  nutritionInfo: jsonb("nutrition_info"),
  cardiovascularQuestions: jsonb("cardiovascular_questions"),
  anthropometric: jsonb("anthropometric"),
  medicalDocuments: jsonb("medical_documents"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});
