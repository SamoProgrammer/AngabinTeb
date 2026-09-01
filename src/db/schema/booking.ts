import { pgTable, text, timestamp, integer, numeric, index, uniqueIndex } from "drizzle-orm/pg-core";
import { providers, services, locations } from "./catalog";

export const appointments = pgTable(
  "appointment",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id").notNull(), // FK user.id (identity context)
    serviceId: text("service_id").notNull().references(() => services.id),
    providerId: text("provider_id").notNull().references(() => providers.id),
    locationId: text("location_id").references(() => locations.id),
    slotId: text("slot_id").notNull(),
    partySize: integer("party_size").notNull().default(1),
    status: text("status").notNull().default("confirmed"), // confirmed | pending | cancelled | completed | no_show
    paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid | paid_at_location | paid_online | refunded
    price: numeric("price", { precision: 12, scale: 0 }).notNull(),
    notes: text("notes"),
    homeCityId: text("home_city_id"),
    homeAddressLine: text("home_address_line"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("one_booking_per_slot")
      .on(t.slotId)
      .where(sql`status NOT IN ('cancelled','no_show')`),
    uniqueIndex("appointment_idempotency").on(t.idempotencyKey),
    index("appointment_patient").on(t.patientId),
  ],
);

import { sql } from "drizzle-orm";