import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const b2bApplications = pgTable("b2b_application", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  sector: text("sector").notNull(), // physicians | labs | hospitals | pharmacies | health_foods | gyms | other
  proposal: text("proposal").notNull(),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clinicalComplaints = pgTable("clinical_complaint", {
  id: text("id").primaryKey(),
  trackingCode: text("tracking_code").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  serviceOrAppointmentCode: text("service_or_appointment_code"),
  targetDoctorOrDepartment: text("target_doctor_or_department").notNull(),
  description: text("description").notNull(),
  evidenceUrl: text("evidence_url"),
  status: text("status").notNull().default("submitted"), // submitted | reviewing | resolved
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
