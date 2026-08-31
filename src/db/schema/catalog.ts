import { pgTable, text, timestamp, integer, boolean, numeric, jsonb, type AnyPgColumn } from "drizzle-orm/pg-core";

export const providers = pgTable("provider", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(), // person | organization
  orgType: text("org_type"),    // clinic | office | service_org, null when person
  name: text("name").notNull(), // Persian base
  primaryLocationId: text("primary_location_id"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const practitioners = pgTable("practitioner", {
  providerId: text("provider_id").primaryKey().references(() => providers.id, { onDelete: "cascade" }),
  specialtyId: text("specialty_id"), // FK service_category.id (specialties live there)
  bio: text("bio"),                  // Persian base
  credentials: text("credentials"),
  cvUrl: text("cv_url"),
  videoUrl: text("video_url"),
});

export const locations = pgTable("location", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // Persian base
  addressLine: text("address_line"),
  cityId: text("city_id").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
});

export const serviceCategories = pgTable("service_category", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(), // Persian base
  parentId: text("parent_id").references((): AnyPgColumn => serviceCategories.id),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const services = pgTable("service", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id),
  categoryId: text("category_id").notNull().references(() => serviceCategories.id),
  serviceType: text("service_type").notNull(), // diagnostic | therapy | home_care | rehab | ambulance | consultation
  locationId: text("location_id").references(() => locations.id),
  name: text("name").notNull(), // Persian base
  durationMinutes: integer("duration_minutes").notNull(),
  basePrice: numeric("base_price", { precision: 12, scale: 0 }).notNull().default("0"),
  isBookable: boolean("is_bookable").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
});

export const diagnosticServices = pgTable("diagnostic_service", {
  serviceId: text("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  prepInstructions: text("prep_instructions"), // Persian base
  fastingHours: integer("fasting_hours"),
  requiresReferral: boolean("requires_referral").notNull().default(false),
});

export const homeCareServices = pgTable("home_care_service", {
  serviceId: text("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  requiresPatientAddress: boolean("requires_patient_address").notNull().default(true),
  serviceableCityIds: jsonb("serviceable_city_ids").notNull().default([]), // string[]
});

export const ambulanceServices = pgTable("ambulance_service", {
  serviceId: text("service_id").primaryKey().references(() => services.id, { onDelete: "cascade" }),
  dispatchModel: text("dispatch_model"), // Phase 4
  vehicleType: text("vehicle_type"),     // Phase 4
});

export const availabilitySlots = pgTable("availability_slot", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull().references(() => providers.id),
  serviceId: text("service_id").notNull().references(() => services.id),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  capacity: integer("capacity").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  bookedCount: integer("booked_count").notNull().default(0),
  heldUntil: timestamp("held_until", { withTimezone: true }),
  heldBy: text("held_by"),
});