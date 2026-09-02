import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./identity";
import { appointments } from "./booking";
import { providers, services } from "./catalog";

export const supportRequests = pgTable(
  "support_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // question | complaint | appointment_issue
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: text("status").notNull().default("open"), // open | in_progress | resolved | closed
    priority: text("priority").notNull().default("normal"), // normal | high
    appointmentId: text("appointment_id").references(() => appointments.id),
    serviceId: text("service_id").references(() => services.id),
    providerId: text("provider_id").references(() => providers.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("support_status").on(t.status)],
);