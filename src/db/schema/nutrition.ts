import { pgTable, text, timestamp, integer, numeric, date, index, primaryKey, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./identity";
import { providers } from "./catalog";

export const physiologyProfiles = pgTable("physiology_profile", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  sex: text("sex").notNull(), // male | female
  birthDate: date("birth_date").notNull(),
  heightCm: numeric("height_cm", { precision: 5, scale: 1 }).notNull(),
  weightKg: numeric("weight_kg", { precision: 5, scale: 1 }).notNull(),
  activityLevel: text("activity_level").notNull().default("moderate"), // sedentary|light|moderate|active|very_active
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const foods = pgTable("food", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Persian base
  category: text("category").notNull(),
  mealTypes: text("meal_types").array().notNull().default([]),
  imageUrl: text("image_url"),
  source: text("source").notNull(),
  sourceVersion: text("source_version").notNull(),
});

export const servingUnits = pgTable("serving_unit", {
  id: text("id").primaryKey(),
  foodId: text("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // Persian base: بشقاب / ملاقه / قاشق / گرم
  gramsEquivalent: numeric("grams_equivalent", { precision: 8, scale: 1 }).notNull(),
});

export const nutrients = pgTable("nutrient", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(), // Persian base
  unit: text("unit").notNull(), // kcal | g | mg | µg
});

export const foodNutrients = pgTable(
  "food_nutrient",
  {
    foodId: text("food_id").notNull().references(() => foods.id, { onDelete: "cascade" }),
    nutrientId: text("nutrient_id").notNull().references(() => nutrients.id),
    amountPer100g: numeric("amount_per_100g", { precision: 10, scale: 2 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.foodId, t.nutrientId] }),
  ],
);

export const nutrientRequirements = pgTable(
  "nutrient_requirement",
  {
    nutrientId: text("nutrient_id").notNull().references(() => nutrients.id),
    sex: text("sex").notNull(), // male | female | any
    ageMin: integer("age_min").notNull(), // inclusive
    ageMax: integer("age_max").notNull(), // inclusive; 200 = 200+
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    source: text("source").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.nutrientId, t.sex, t.ageMin] }),
  ],
);

export const foodIntakes = pgTable(
  "food_intake",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    foodId: text("food_id").notNull().references(() => foods.id),
    servingUnitId: text("serving_unit_id").notNull().references(() => servingUnits.id),
    quantity: numeric("quantity", { precision: 6, scale: 2 }).notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
    mealSlot: text("meal_slot"), // صبحانه | ناهار | شام | میان‌وعده
    periodId: text("period_id").references(() => intakePeriods.id, { onDelete: "set null" }),
  },
  (t) => [index("intake_user_day").on(t.userId, t.loggedAt), index("food_intake_period_id_idx").on(t.periodId)],
);

export const dailyNutrition = pgTable(
  "daily_nutrition",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    energyKcal: numeric("energy_kcal", { precision: 10, scale: 2 }).notNull().default("0"),
    carbsG: numeric("carbs_g", { precision: 10, scale: 2 }).notNull().default("0"),
    proteinG: numeric("protein_g", { precision: 10, scale: 2 }).notNull().default("0"),
    fatG: numeric("fat_g", { precision: 10, scale: 2 }).notNull().default("0"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const intakePeriods = pgTable(
  "intake_period",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    sex: text("sex").notNull(),
    age: integer("age").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 1 }).notNull(),
    heightCm: numeric("height_cm", { precision: 5, scale: 1 }).notNull(),
    activityLevel: text("activity_level").notNull().default("moderate"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("period_user").on(t.userId)],
);

export const dietPrograms = pgTable("diet_program", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Persian base
  organizationContext: text("organization_context").notNull(), // banks|universities|health_centers|clinics|other
  planType: text("plan_type").notNull(),
  durationDays: integer("duration_days").notNull(),
  price: numeric("price", { precision: 12, scale: 0 }).notNull().default("0"),
  practitionerId: text("practitioner_id").references(() => providers.id),
  description: text("description"), // Persian base
  downloadUrl: text("download_url"), // nullable: file attached to the program; served only through the claim gate
});

export const dietClaims = pgTable("diet_claim", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programId: text("program_id").notNull().references(() => dietPrograms.id),
  status: text("status").notNull().default("pending"), // pending | paid | generating | needs_review | ready | failed (+ legacy active | completed)
  organizationContext: text("organization_context"), // banks|universities|health_centers|clinics|other
  pricePaid: numeric("price_paid", { precision: 12, scale: 0 }),
  retryCount: integer("retry_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("one_claim_per_program").on(t.userId, t.programId).where(sql`status != 'completed'`),
]);

export const dietDocuments = pgTable("diet_document", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => dietClaims.id, { onDelete: "cascade" }).unique(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull().default("v1"),
  bodyMarkdown: text("body_markdown").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const registrySnapshots = pgTable("registry_snapshot", {
  id: text("id").primaryKey(),
  claimId: text("claim_id").notNull().references(() => dietClaims.id, { onDelete: "cascade" }).unique(),
  personInfo: jsonb("person_info"),
  medicalHistory: jsonb("medical_history"),
  drugHistory: jsonb("drug_history"),
  addictionHistory: jsonb("addiction_history"),
  nutritionInfo: jsonb("nutrition_info"),
  cardiovascularQuestions: jsonb("cardiovascular_questions"),
  anthropometric: jsonb("anthropometric"),
  medicalDocuments: jsonb("medical_documents"),
  snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull().defaultNow(),
});
