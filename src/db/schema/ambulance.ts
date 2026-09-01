import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { appointments } from "./booking";
import { services } from "./catalog";

export const dispatchRecords = pgTable("dispatch_record", {
  id: text("id").primaryKey(),
  ambulanceServiceId: text("ambulance_service_id").notNull().references(() => services.id),
  appointmentId: text("appointment_id").notNull().references(() => appointments.id),
  status: text("status").notNull().default("scheduled"), // scheduled | en_route | completed | cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});