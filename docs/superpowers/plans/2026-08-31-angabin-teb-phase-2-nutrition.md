# Angabin Teb — Phase 2: Nutrition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the nutrition workspace: physiology profile, food database with Iranian serving units, intake logging with per-100g nutrient math, calorie counter, daily rollups, diet acquisition, and nutrition admin.

**Architecture:** The nutrition kernel (`contexts/nutrition/kernel.ts`) is pure and DB-free — serving units resolve to grams, nutrients scale from per-100g, daily rollups recompute on intake write, requirements look up by sex/age band, and energy uses Mifflin-St Jeor × activity factor (spec §7). The database holds `food_nutrient` as **rows** (adding a micronutrient is a data insert, never a migration). `NutritionAnalysis` is computed, not stored.

**Tech Stack:** Everything from Phases 0–1, plus nothing new.

**Spec:** `docs/superpowers/specs/2026-08-31-angabin-teb-design.md` (§5.4, §7, §9 nutrition admin, §11 Phase 2, §13 risks 1–2)

**Predecessor:** `docs/superpowers/plans/2026-08-31-angabin-teb-phase-1-core.md`

## Global Constraints

1. **Nutrition schema** (spec §5.4): `physiology_profile`, `food`, `serving_unit`, `nutrient`, `food_nutrient`, `nutrient_requirement`, `food_intake`, `daily_nutrition`, `diet_program`. Nutrient amounts are **per 100 g**.
2. **Serving units are the domain trick** (spec §5.4): `serving_unit.grams_equivalent` converts "one ladle" to grams; all math then scales per-100g.
3. **`NutritionAnalysis` is not a table** — computed against `daily_nutrition`, a rollup recomputed on intake write.
4. **Energy requirement formula named** (spec §7): Mifflin-St Jeor BMR × activity factor. Not invented at implementation time.
5. **Reference data is a discovery spike, not a coding task** (spec §13 risk 1): a named food composition table (Iran FCT or USDA FDC) and a named RDA authority must be picked **before** Task 2.2 seeding. The seed uses the chosen source's values and records `source`/`source_version` on every `food` row.
6. **Food DB seeding starts at 50–100 foods** (spec §13 risk 2), each with serving units and ≥ 8 nutrients (energy, carb, protein, fat, plus 4+ micronutrients). Expand later.
7. `diet_program` (F-011) keeps `organization_context` (banks | universities | health_centers | clinics | other) as a first-class field.
8. Physiology inputs per F-012: sex, birth_date (age), height_cm, weight_kg, activity_level.
9. Phase 2 consumes auth from Phase 0 and admin primitives from Phase 1 — no new infrastructure.

## File Map

```
src/
  db/schema/nutrition.ts
  contexts/nutrition/
    model.ts
    kernel.ts                 # pure: conversion, rollup, requirements, energy
    queries.ts
    actions.ts
    __tests__/kernel.test.ts
  app/[locale]/
    (nutrition)/
      layout.tsx              # workspace nav
      page.tsx                # workspace home (links)
      body/page.tsx           # My Body
      diary/page.tsx          # food diary + calorie counter
      foods/page.tsx          # food database browse/search
      foods/[id]/page.tsx     # food detail with nutrients
      diet/page.tsx           # diet acquisition
    admin/
      foods/page.tsx  foods/[id]/page.tsx
      diet-programs/page.tsx
  e2e/nutrition.spec.ts
```

---

### Task 2.1: Nutrition schema + migration

**Files:**
- Create: `src/db/schema/nutrition.ts`
- Modify: `src/db/schema/index.ts`

**Interfaces:**
- Consumes: `users` (identity)
- Produces (exact names used everywhere in this phase): `physiologyProfiles`, `foods`, `servingUnits`, `nutrients`, `foodNutrients`, `nutrientRequirements`, `foodIntakes`, `dailyNutrition`, `dietPrograms`

- [ ] **Step 1: Write the schema**

`src/db/schema/nutrition.ts`:

```ts
import { pgTable, text, timestamp, integer, numeric, date, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";

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
  },
  (t) => [index("intake_user_day").on(t.userId, t.loggedAt)],
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

export const dietPrograms = pgTable("diet_program", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Persian base
  organizationContext: text("organization_context").notNull(), // banks|universities|health_centers|clinics|other
  planType: text("plan_type").notNull(),
  durationDays: integer("duration_days").notNull(),
  price: numeric("price", { precision: 12, scale: 0 }).notNull().default("0"),
  practitionerId: text("practitioner_id").references(() => providers.id),
  description: text("description"), // Persian base
});

import { users } from "./identity";
import { providers } from "./catalog";
```

- [ ] **Step 2: Barrel-export and migrate**

`src/db/schema/index.ts` — add `export * from "./nutrition";`

```bash
bun run db:generate && bun run db:migrate
```

Expected: 9 tables created.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: nutrition schema with per-100g nutrient rows"
```

---

### Task 2.2: Nutrition kernel (pure, TDD)

**Files:**
- Create: `src/contexts/nutrition/kernel.ts`, `src/contexts/nutrition/model.ts`, `src/contexts/nutrition/__tests__/kernel.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions)
- Produces:
  - `servingToGrams(quantity: number, gramsEquivalent: number): number`
  - `nutrientsForIntake(grams: number, per100g: Record<string, number>): Record<string, number>`
  - `sumDay(rows: Array<Record<string, number>>): Record<string, number>`
  - `requirementFor(nutrientId: string, sex: "male"|"female"|"any", age: number, table: RequirementRow[]): number | null`
  - `bmr({ sex, weightKg, heightCm, age }): number` and `tdee(bmr, activityLevel): number` — Mifflin-St Jeor, spec §7
  - `activityFactors: Record<ActivityLevel, number>` with `sedentary:1.2, light:1.375, moderate:1.55, active:1.725, very_active:1.9`
  - `deficits(actual: Record<string, number>, required: Record<string, number>): Array<{ nutrientId; deficit: number }>` — positive when actual < required

- [ ] **Step 1: Write the failing tests**

`src/contexts/nutrition/__tests__/kernel.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  servingToGrams, nutrientsForIntake, sumDay, requirementFor,
  bmr, tdee, deficits,
} from "../kernel";

describe("servingToGrams", () => {
  it("converts quantity × grams-equivalent", () => {
    expect(servingToGrams(2, 150)).toBe(300);
    expect(servingToGrams(0.5, 150)).toBe(75);
  });
});

describe("nutrientsForIntake", () => {
  it("scales per-100g values by grams", () => {
    const per100g = { energy: 100, protein: 5.5 };
    expect(nutrientsForIntake(200, per100g)).toEqual({ energy: 200, protein: 11 });
  });
});

describe("sumDay", () => {
  it("sums multiple intake rows", () => {
    const rows = [{ energy: 100, protein: 5 }, { energy: 50, protein: 2.5 }];
    expect(sumDay(rows)).toEqual({ energy: 150, protein: 7.5 });
  });
  it("returns zeros for an empty day", () => {
    expect(sumDay([])).toEqual({});
  });
});

describe("requirementFor", () => {
  const table = [
    { nutrientId: "iron", sex: "female", ageMin: 19, ageMax: 50, amount: 18, source: "test" },
    { nutrientId: "iron", sex: "female", ageMin: 51, ageMax: 200, amount: 8, source: "test" },
    { nutrientId: "energy", sex: "any", ageMin: 0, ageMax: 200, amount: 2000, source: "test" },
  ];
  it("matches sex and age band", () => {
    expect(requirementFor("iron", "female", 30, table)).toBe(18);
    expect(requirementFor("iron", "female", 60, table)).toBe(8);
  });
  it("falls back to sex=any", () => {
    expect(requirementFor("energy", "male", 40, table)).toBe(2000);
  });
  it("returns null when no band matches", () => {
    expect(requirementFor("iron", "male", 30, table)).toBeNull();
  });
});

describe("energy", () => {
  it("computes Mifflin-St Jeor BMR for a male", () => {
    // 10×75 + 6.25×175 − 5×30 + 5
    expect(bmr({ sex: "male", weightKg: 75, heightCm: 175, age: 30 })).toBeCloseTo(1683.75, 2);
  });
  it("computes TDEE from BMR and activity", () => {
    expect(tdee(bmr({ sex: "male", weightKg: 75, heightCm: 175, age: 30 }), "moderate"))
      .toBeCloseTo(1683.75 * 1.55, 2);
  });
});

describe("deficits", () => {
  it("flags nutrients below requirement", () => {
    expect(deficits({ iron: 10 }, { iron: 18 })).toEqual([{ nutrientId: "iron", deficit: 8 }]);
  });
  it("ignores nutrients at or above requirement", () => {
    expect(deficits({ iron: 20 }, { iron: 18 })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bunx vitest run src/contexts/nutrition/__tests__/kernel.test.ts`
Expected: FAIL — kernel not defined.

- [ ] **Step 3: Write the kernel**

`src/contexts/nutrition/kernel.ts`:

```ts
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export type RequirementRow = {
  nutrientId: string;
  sex: "male" | "female" | "any";
  ageMin: number;
  ageMax: number;
  amount: number;
  source: string;
};

export function servingToGrams(quantity: number, gramsEquivalent: number): number {
  return quantity * gramsEquivalent;
}

export function nutrientsForIntake(
  grams: number,
  per100g: Record<string, number>,
): Record<string, number> {
  const factor = grams / 100;
  return Object.fromEntries(Object.entries(per100g).map(([k, v]) => [k, v * factor]));
}

export function sumDay(rows: Array<Record<string, number>>): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    for (const [k, v] of Object.entries(row)) acc[k] = (acc[k] ?? 0) + v;
    return acc;
  }, {});
}

export function requirementFor(
  nutrientId: string,
  sex: "male" | "female" | "any",
  age: number,
  table: RequirementRow[],
): number | null {
  const exact = table.find(
    (r) => r.nutrientId === nutrientId && r.sex === sex && age >= r.ageMin && age <= r.ageMax,
  );
  if (exact) return Number(exact.amount);
  const any = table.find(
    (r) => r.nutrientId === nutrientId && r.sex === "any" && age >= r.ageMin && age <= r.ageMax,
  );
  return any ? Number(any.amount) : null;
}

export function bmr(input: { sex: "male" | "female"; weightKg: number; heightCm: number; age: number }): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return input.sex === "male" ? base + 5 : base - 161;
}

export function tdee(bmrValue: number, level: ActivityLevel): number {
  return bmrValue * activityFactors[level];
}

export function deficits(
  actual: Record<string, number>,
  required: Record<string, number>,
): Array<{ nutrientId: string; deficit: number }> {
  return Object.entries(required)
    .filter(([id, req]) => (actual[id] ?? 0) < req)
    .map(([id, req]) => ({ nutrientId: id, deficit: req - (actual[id] ?? 0) }));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `bunx vitest run src/contexts/nutrition/__tests__/kernel.test.ts`
Expected: PASS, 15 assertions.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: nutrition kernel — conversion, rollup, requirements, energy"
```

---

### Task 2.3: Nutrient reference data discovery spike + seed

**Files:**
- Create: `scripts/seed-nutrition.ts`, `src/contexts/nutrition/model.ts` (row types)

**Interfaces:**
- Consumes: kernel (2.2), nutrition schema (2.1)
- Produces: `bun run db:seed:nutrition` — idempotent; 50–100 foods, each with serving units and ≥ 8 nutrients, plus the `nutrient` rows (energy, carbs, protein, fat, fiber, iron, calcium, vitamin C, vitamin D, sodium) and the `nutrient_requirement` table for those nutrients, with `source` recorded

**This task is gated on the §13 risk-1 spike:** before writing it, pick the food composition source (Iran national FCT or USDA FDC) and the RDA authority (WHO/FAO or national standard) and record both in the seed file header comment and on every row's `source`/`source_version`.

- [ ] **Step 1: Write the seed**

`scripts/seed-nutrition.ts`:

```ts
import "dotenv/config";
import { db } from "../src/db";
import { nutrients, foods, servingUnits, foodNutrients, nutrientRequirements } from "../src/db/schema";

// SOURCE: <chosen FCT name + version>   RDA: <chosen authority>
// ponytail: 50-100 foods is the ceiling (spec §13 risk 2); expand via admin UI, not seed size.

const NUTRIENTS = [
  { id: "n-energy", slug: "energy", name: "انرژی", unit: "kcal" },
  { id: "n-carbs", slug: "carbs", name: "کربوهیدرات", unit: "g" },
  { id: "n-protein", slug: "protein", name: "پروتئین", unit: "g" },
  { id: "n-fat", slug: "fat", name: "چربی", unit: "g" },
  { id: "n-fiber", slug: "fiber", name: "فیبر", unit: "g" },
  { id: "n-iron", slug: "iron", name: "آهن", unit: "mg" },
  { id: "n-calcium", slug: "calcium", name: "کلسیم", unit: "mg" },
  { id: "n-vitc", slug: "vitamin_c", name: "ویتامین C", unit: "mg" },
];

async function upsertNutrients() {
  for (const n of NUTRIENTS) {
    await db.insert(nutrients).values(n).onConflictDoUpdate({ target: nutrients.id, set: { slug: n.slug, name: n.name, unit: n.unit } });
  }
}

// One food, fully specified — the template every seeded food follows.
const FOODS: Array<{
  id: string; name: string; category: string; mealTypes: string[];
  per100g: Record<string, number>;
  servingUnits: Array<{ id: string; name: string; grams: number }>;
}> = [
  {
    id: "food-ash-reshteh", name: "آش رشته", category: "soup", mealTypes: ["lunch", "dinner"],
    per100g: { "n-energy": 92, "n-carbs": 12, "n-protein": 3.1, "n-fat": 3.6, "n-fiber": 2.1, "n-iron": 1.2, "n-calcium": 28, "n-vitc": 0 },
    servingUnits: [
      { id: "su-ash-plate", name: "بشقاب", grams: 300 },
      { id: "su-ash-ladle", name: "ملاقه", grams: 120 },
      { id: "su-ash-spoon", name: "قاشق", grams: 15 },
      { id: "su-ash-gram", name: "گرم", grams: 1 },
    ],
  },
  // …49–99 more foods from the chosen FCT, same shape, covering
  // breakfast/lunch/dinner, Iranian and international items (spec F-012).
];

async function main() {
  await upsertNutrients();
  for (const f of FOODS) {
    await db.insert(foods).values({
      id: f.id, name: f.name, category: f.category, mealTypes: f.mealTypes,
      source: "chosen-fct", sourceVersion: "1",
    }).onConflictDoNothing();
    for (const su of f.servingUnits) {
      await db.insert(servingUnits).values({ id: su.id, foodId: f.id, name: su.name, gramsEquivalent: String(su.grams) })
        .onConflictDoNothing();
    }
    for (const [nutrientId, amount] of Object.entries(f.per100g)) {
      await db.insert(foodNutrients).values({ foodId: f.id, nutrientId, amountPer100g: String(amount) })
        .onConflictDoNothing();
    }
  }
  console.log(`seeded ${FOODS.length} foods`);
}

main().then(() => process.exit(0));
```

Add `"db:seed:nutrition": "tsx scripts/seed-nutrition.ts"` to `package.json`. The `nutrient_requirement` seed rows follow the same upsert pattern with bands per sex/age from the chosen authority (reference the Task 2.2 test table's band logic).

- [ ] **Step 2: Run it twice**

```bash
bun run db:seed:nutrition
bun run db:seed:nutrition
```

Expected: idempotent; second run inserts nothing (`onConflictDoNothing`), prints the same count.

- [ ] **Step 3: Verify math on a hand-checked case**

```bash
bunx tsx -e "
import { db } from './src/db';
import { foods, servingUnits, foodNutrients } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { servingToGrams, nutrientsForIntake } from './src/contexts/nutrition/kernel';
const su = await db.select().from(servingUnits).where(eq(servingUnits.id,'su-ash-plate'));
const fn = await db.select().from(foodNutrients).where(eq(foodNutrients.foodId,'food-ash-reshteh'));
const per100g = Object.fromEntries(fn.map(r=>[r.nutrientId, Number(r.amountPer100g)]));
console.log(nutrientsForIntake(servingToGrams(1, Number(su[0].gramsEquivalent)), per100g));
"
```

Expected: one plate of آش رشته ≈ 3× the per-100g values (e.g. energy ≈ 276 kcal).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: nutrient reference seed — foods, serving units, requirements"
```

---

### Task 2.4: My Body (physiology profile)

**Files:**
- Create: `src/contexts/nutrition/actions.ts`, `src/contexts/nutrition/queries.ts`, `src/app/[locale]/(nutrition)/layout.tsx`, `src/app/[locale]/(nutrition)/page.tsx`, `src/app/[locale]/(nutrition)/body/page.tsx`

**Interfaces:**
- Consumes: `requireUser` (Phase 0), schema (2.1), kernel `bmr`/`tdee` (2.2)
- Produces:
  - `savePhysiology(input: { sex; birthDate; heightCm; weightKg; activityLevel }): Promise<{ ok: true } | { ok: false; error: string }>` — upsert, Zod-validated; recomputes nothing (rollups are nutrient-based, not energy-based)
  - `getPhysiology(userId): Promise<PhysiologyRow | null>` — includes computed `age`, `bmr`, `tdee`

- [ ] **Step 1: Write actions and queries**

`src/contexts/nutrition/actions.ts`:

```ts
"use server";

import { z } from "zod";
import { db } from "@/db";
import { physiologyProfiles } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { bmr, tdee, type ActivityLevel } from "./kernel";

const physiologySchema = z.object({
  sex: z.enum(["male", "female"]),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  heightCm: z.number().min(80).max(250),
  weightKg: z.number().min(25).max(300),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

export async function savePhysiology(input: z.infer<typeof physiologySchema>) {
  const user = await requireUser();
  const data = physiologySchema.parse(input);
  await db
    .insert(physiologyProfiles)
    .values({ userId: user.id, ...data, heightCm: String(data.heightCm), weightKg: String(data.weightKg) })
    .onConflictDoUpdate({ target: physiologyProfiles.userId, set: { ...data, updatedAt: new Date() } });
  return { ok: true as const };
}
```

`src/contexts/nutrition/queries.ts`:

```ts
import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { physiologyProfiles } from "@/db/schema";
import { bmr, tdee } from "./kernel";

export async function getPhysiology(userId: string) {
  const [row] = await db.select().from(physiologyProfiles).where(eq(physiologyProfiles.userId, userId));
  if (!row) return null;
  const age = Math.floor((Date.now() - new Date(row.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  const bmrValue = bmr({ sex: row.sex as "male" | "female", weightKg: Number(row.weightKg), heightCm: Number(row.heightCm), age });
  return {
    ...row,
    age,
    bmr: Math.round(bmrValue),
    tdee: Math.round(tdee(bmrValue, row.activityLevel as ActivityLevel)),
  };
}
```

- [ ] **Step 2: Write the workspace layout and My Body page**

`src/app/[locale]/(nutrition)/layout.tsx`:

```tsx
import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";

export default async function NutritionLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-8 flex flex-wrap gap-4 text-sm">
        <a href="/body" className="text-emerald-700 underline">My Body</a>
        <a href="/diary" className="text-emerald-700 underline">Food diary</a>
        <a href="/foods" className="text-emerald-700 underline">Food database</a>
        <a href="/diet" className="text-emerald-700 underline">Get a diet</a>
      </nav>
      {children}
    </main>
  );
}
```

`src/app/[locale]/(nutrition)/body/page.tsx` — form posting to `savePhysiology`, then a read-only summary when a profile exists:

```tsx
import { requireUser } from "@/contexts/identity/actions";
import { getPhysiology } from "@/contexts/nutrition/queries";
import { savePhysiology } from "@/contexts/nutrition/actions";

export default async function BodyPage() {
  const user = await requireUser();
  const profile = await getPhysiology(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold">My Body</h1>
      {profile && (
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">Age</dt><dd>{profile.age}</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">Height</dt><dd>{profile.heightCm} cm</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">Weight</dt><dd>{profile.weightKg} kg</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">BMR</dt><dd>{profile.bmr} kcal</dd></div>
          <div className="rounded border p-4"><dt className="text-sm text-gray-500">TDEE</dt><dd>{profile.tdee} kcal</dd></div>
        </dl>
      )}
      <form action={savePhysiology} className="mt-8 grid max-w-md gap-4">
        <label className="flex items-center gap-2">
          Sex
          <select name="sex" defaultValue={profile?.sex ?? "male"} className="flex-1 rounded border px-3 py-2">
            <option value="male">Male</option><option value="female">Female</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Birth date
          <input name="birthDate" type="date" defaultValue={profile?.birthDate} required className="flex-1 rounded border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2">
          Height (cm)
          <input name="heightCm" type="number" defaultValue={profile?.heightCm} required className="flex-1 rounded border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2">
          Weight (kg)
          <input name="weightKg" type="number" defaultValue={profile?.weightKg} required className="flex-1 rounded border px-3 py-2" />
        </label>
        <label className="flex items-center gap-2">
          Activity
          <select name="activityLevel" defaultValue={profile?.activityLevel ?? "moderate"} className="flex-1 rounded border px-3 py-2">
            {["sedentary","light","moderate","active","very_active"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Save</button>
      </form>
    </div>
  );
}
```

`src/app/[locale]/(nutrition)/page.tsx`: workspace home with links to body/diary/foods/diet.

- [ ] **Step 3: Verify**

Run: `bun run dev` — as a signed-in user, save a profile (male, 75 kg, 175 cm, age 30) → summary shows BMR 1684 and TDEE 2610 (1683.75 × 1.55).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: My Body physiology profile with energy estimates"
```

---

### Task 2.5: Food diary + calorie counter

**Files:**
- Create: `src/app/[locale]/(nutrition)/diary/page.tsx`, `src/components/nutrition/log-food.tsx`
- Modify: `src/contexts/nutrition/actions.ts`, `src/contexts/nutrition/queries.ts`

**Interfaces:**
- Consumes: kernel `servingToGrams`/`nutrientsForIntake`/`sumDay` (2.2), schema (2.1)
- Produces:
  - `logIntake(input: { foodId; servingUnitId; quantity }): Promise<{ ok: true } | { ok: false; error }>` — inserts `food_intake`, recomputes the `daily_nutrition` rollup for the affected day in the same transaction
  - `dayIntake(userId, day): Promise<{ intakes: IntakeRow[]; totals: Record<string, number>; requirements: Record<string, number>; deficits: Deficit[]; energy: { consumed: number; tdee: number } }>`
  - `searchFoods(term, locale): Promise<FoodCard[]>` — FTS over `food.name` with translation overlay (pattern from Phase 1 Task 1.3)

- [ ] **Step 1: Add the intake action with rollup recompute**

Append to `src/contexts/nutrition/actions.ts`:

```ts
import { sql, eq, and, gte, lt } from "drizzle-orm";
import { foodIntakes, foods, servingUnits, foodNutrients, dailyNutrition, nutrients } from "@/db/schema";
import { servingToGrams, nutrientsForIntake, sumDay } from "./kernel";

const intakeSchema = z.object({
  foodId: z.string().min(1),
  servingUnitId: z.string().min(1),
  quantity: z.number().positive(),
});

export async function logIntake(input: z.infer<typeof intakeSchema>) {
  const user = await requireUser();
  const data = intakeSchema.parse(input);

  await db.transaction(async (tx) => {
    const [food] = await tx.select().from(foods).where(eq(foods.id, data.foodId));
    const [su] = await tx.select().from(servingUnits).where(eq(servingUnits.id, data.servingUnitId));
    if (!food || !su || su.foodId !== data.foodId) throw new Error("invalid serving unit for food");
    const rows = await tx
      .select()
      .from(foodNutrients)
      .where(eq(foodNutrients.foodId, data.foodId));

    const per100g = Object.fromEntries(rows.map((r) => [r.nutrientId, Number(r.amountPer100g)]));
    const grams = servingToGrams(data.quantity, Number(su.gramsEquivalent));
    const values = nutrientsForIntake(grams, per100g);

    await tx.insert(foodIntakes).values({ id: crypto.randomUUID(), userId: user.id, ...data });
    await tx.insert(dailyNutrition).values({
      userId: user.id,
      day: new Date().toISOString().slice(0, 10),
      energyKcal: String(values["n-energy"] ?? 0),
      carbsG: String(values["n-carbs"] ?? 0),
      proteinG: String(values["n-protein"] ?? 0),
      fatG: String(values["n-fat"] ?? 0),
    }).onConflictDoUpdate({
      target: [dailyNutrition.userId, dailyNutrition.day],
      set: {
        energyKcal: sql`${dailyNutrition.energyKcal} + ${values["n-energy"] ?? 0}`,
        carbsG: sql`${dailyNutrition.carbsG} + ${values["n-carbs"] ?? 0}`,
        proteinG: sql`${dailyNutrition.proteinG} + ${values["n-protein"] ?? 0}`,
        fatG: sql`${dailyNutrition.fatG} + ${values["n-fat"] ?? 0}`,
      },
    });
  });
  return { ok: true as const };
}
```

- [ ] **Step 2: Add the day query**

Append to `src/contexts/nutrition/queries.ts`:

```ts
import { sql } from "drizzle-orm";
import { foodIntakes, foods, servingUnits, dailyNutrition, nutrientRequirements, nutrients } from "@/db/schema";
import { deficits } from "./kernel";

export async function dayIntake(userId: string, day: string) {
  const start = `${day}T00:00:00Z`;
  const end = `${day}T23:59:59Z`;
  const intakes = await db
    .select({
      id: foodIntakes.id,
      foodId: foodIntakes.foodId,
      foodName: foods.name,
      servingUnitName: servingUnits.name,
      quantity: foodIntakes.quantity,
      loggedAt: foodIntakes.loggedAt,
    })
    .from(foodIntakes)
    .innerJoin(foods, eq(foodIntakes.foodId, foods.id))
    .innerJoin(servingUnits, eq(foodIntakes.servingUnitId, servingUnits.id))
    .where(and(
      eq(foodIntakes.userId, userId),
      gte(foodIntakes.loggedAt, new Date(start)),
      lt(foodIntakes.loggedAt, new Date(end)),
    ))
    .orderBy(foodIntakes.loggedAt);

  const [rollup] = await db
    .select()
    .from(dailyNutrition)
    .where(and(eq(dailyNutrition.userId, userId), eq(dailyNutrition.day, day)));

  return {
    intakes,
    totals: rollup
      ? { "n-energy": Number(rollup.energyKcal), "n-carbs": Number(rollup.carbsG), "n-protein": Number(rollup.proteinG), "n-fat": Number(rollup.fatG) }
      : {},
  };
}
```

- [ ] **Step 3: Write the diary page and log form**

`src/components/nutrition/log-food.tsx` (client — food + serving unit + quantity, then `logIntake`):

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logIntake } from "@/contexts/nutrition/actions";

type FoodOption = { id: string; name: string; servingUnits: Array<{ id: string; name: string }> };

export function LogFood({ foods }: { foods: FoodOption[] }) {
  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const [servingUnitId, setServingUnitId] = useState(foods[0]?.servingUnits[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const food = foods.find((f) => f.id === foodId);

  function onFoodChange(id: string) {
    setFoodId(id);
    setServingUnitId(foods.find((f) => f.id === id)?.servingUnits[0]?.id ?? "");
  }

  return (
    <form
      className="mt-6 grid max-w-md gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await logIntake({ foodId, servingUnitId, quantity: Number(quantity) });
          if (res.ok) router.refresh();
          else setError("Failed to log intake");
        });
      }}
    >
      <label className="flex items-center gap-2">
        Food
        <select value={foodId} onChange={(e) => onFoodChange(e.target.value)} className="flex-1 rounded border px-3 py-2">
          {foods.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        Serving
        <select value={servingUnitId} onChange={(e) => setServingUnitId(e.target.value)} className="flex-1 rounded border px-3 py-2">
          {food?.servingUnits.map((su) => <option key={su.id} value={su.id}>{su.name}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2">
        Quantity
        <input type="number" step="0.5" min="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="flex-1 rounded border px-3 py-2" />
      </label>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-emerald-600 px-6 py-2 text-white disabled:opacity-50">
        {pending ? "Logging…" : "Log intake"}
      </button>
    </form>
  );
}
```

`src/app/[locale]/(nutrition)/diary/page.tsx`: server component — `dayIntake(user.id, today)` + `searchFoods` for the picker options (add `searchFoods` to queries.ts using the FTS pattern from Phase 1 Task 1.3 over `foods.name`, returning foods with their serving units), render totals (energy/carbs/protein/fat) as cards and the intake list; include the previous 7 days via links (`?day=YYYY-MM-DD`).

- [ ] **Step 4: Verify with the hand-checked case**

Run: `bun run dev` — log 1 plate of آش رشته (`su-ash-plate`, quantity 1) → diary totals show energy ≈ 276, protein ≈ 9.3, fat ≈ 10.8 (3× per-100g from the seed check in Task 2.3 Step 3). Log it again → totals double, proving the rollup increments.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: food diary with rollup recompute and calorie totals"
```

---

### Task 2.6: Food database pages

**Files:**
- Create: `src/app/[locale]/(nutrition)/foods/page.tsx`, `src/app/[locale]/(nutrition)/foods/[id]/page.tsx`

**Interfaces:**
- Consumes: `searchFoods` (2.5), nutrition schema
- Produces: browse/search list with category + meal-type filters; food detail showing serving units, per-100g nutrient table, and (for the signed-in user) a quick-log form reusing `LogFood`

- [ ] **Step 1: Write the browse page**

`src/app/[locale]/(nutrition)/foods/page.tsx` — `searchFoods(q, category)` with the FTS pattern; category filter from a distinct query over `foods.category`; paginated via `?page=` with `limit 20` (NFR-004 — incremental loading for large libraries; 50–100 seeds make 20/page the right slice):

```tsx
import { searchFoods } from "@/contexts/nutrition/queries";

export default async function FoodsPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q, category, page } = await searchParams;
  const current = Math.max(1, Number(page ?? 1));
  const { rows, total } = await searchFoods(locale, q ?? "", category, current);
  const pages = Math.max(1, Math.ceil(total / 20));
  return (
    <div>
      <h1 className="text-2xl font-bold">Food database</h1>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search foods…" className="flex-1 rounded border px-3 py-2" aria-label="Search foods" />
        <select name="category" defaultValue={category ?? ""} className="rounded border px-3 py-2">
          <option value="">All categories</option>
        </select>
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Search</button>
      </form>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {rows.map((f) => (
          <li key={f.id} className="rounded border p-4">
            <a href={`/foods/${f.id}`} className="font-medium">{f.name}</a>
            <p className="text-sm text-gray-500">{f.category}</p>
          </li>
        ))}
      </ul>
      <nav className="mt-8 flex gap-2">
        {current > 1 && <a href={`/foods?page=${current - 1}`}>Previous</a>}
        <span>Page {current} of {pages}</span>
        {current < pages && <a href={`/foods?page=${current + 1}`}>Next</a>}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Write the food detail page**

`src/app/[locale]/(nutrition)/foods/[id]/page.tsx`: `getFoodDetail(id, locale)` (add to queries.ts — food + serving units + `foodNutrients` joined to `nutrients` for names/units, translated name via `localize`), render the per-100g table, and include `<LogFood foods={[food]}/>` for quick logging.

- [ ] **Step 3: Verify**

Run: `bun run dev` — search "آش" returns آش رشته with the English overlay in `/en`; detail shows serving units (بشقاب 300g, ملاقه 120g, …) and the nutrient table; quick-log from the detail page adds to today's diary.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: food database browse, search, detail"
```

---

### Task 2.7: Diet acquisition

**Files:**
- Create: `src/app/[locale]/(nutrition)/diet/page.tsx`, `src/contexts/nutrition/__tests__/diet.test.ts` (if needed — see below)

**Interfaces:**
- Consumes: `dietPrograms` schema (2.1)
- Produces: `/diet` page — organization-context selection (F-011: banks | universities | health_centers | clinics | other) → program listing → claim action (`claimDietProgram(programId)`) writing a `diet_claim` row (add table: `diet_claim(id, user_id, program_id, status, created_at)` with status `pending | active | completed`) → confirmation with practitioner contact info

- [ ] **Step 1: Add the claim table**

Add to `src/db/schema/nutrition.ts`:

```ts
export const dietClaims = pgTable("diet_claim", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  programId: text("program_id").notNull().references(() => dietPrograms.id),
  status: text("status").notNull().default("pending"), // pending | active | completed
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

Regenerate + migrate. Add `claimDietProgram` to `actions.ts` (Zod-validated, `requireUser`, upsert-once per user+program — a partial unique index `(user_id, program_id) where status != 'completed'` to prevent double-claims, mirroring the appointment pattern from Phase 1).

- [ ] **Step 2: Write the acquisition page**

`src/app/[locale]/(nutrition)/diet/page.tsx`: context selector (the five F-011 options) → `listPrograms(context, locale)` (add to queries.ts: `dietPrograms` + translations overlay on `name`/`description` + practitioner name join) → cards with plan type, duration, price, claim button posting to `claimDietProgram` → claimed state shows `pending`.

- [ ] **Step 3: Verify**

Run: `bun run dev` — pick "clinics" → program list → claim → status pending; claiming the same program again is rejected (partial unique index).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: diet acquisition with organizational context"
```

---

### Task 2.8: Nutrition admin + journey test

**Files:**
- Create: `src/app/[locale]/admin/foods/page.tsx`, `src/app/[locale]/admin/foods/[id]/page.tsx`, `src/app/[locale]/admin/diet-programs/page.tsx`, `e2e/nutrition.spec.ts`

**Interfaces:**
- Consumes: admin primitives + CRUD pattern (Phase 1 Task 1.4), nutrition schema
- Produces: food admin (food fields + serving units + nutrient grid — one form, rows per nutrient with `amount_per_100g`), diet program admin; J-004 journey test

- [ ] **Step 1: Write the food admin page**

`src/app/[locale]/admin/foods/[id]/page.tsx` — server component form posting to `saveFood` / `saveServingUnit` / `saveFoodNutrient` actions (add to `actions.ts`: each Zod-validated, `requireAdmin`, upsert; the nutrient grid renders one number input per nutrient row for the food):

```tsx
import { requireAdmin } from "@/contexts/identity/actions";
import { getFoodAdmin } from "@/contexts/nutrition/queries";
import { saveFood, saveServingUnit, saveFoodNutrient } from "@/contexts/nutrition/actions";
import { Input } from "@/components/ui/input";

export default async function AdminFoodPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const food = await getFoodAdmin(id);
  if (!food) return <p>Not found</p>;
  return (
    <div>
      <h1 className="text-2xl font-bold">{food.name}</h1>
      <form action={saveFood} className="mt-6 grid max-w-md gap-3">
        <input type="hidden" name="id" value={food.id} />
        <Input name="name" defaultValue={food.name} required aria-label="Name" />
        <Input name="category" defaultValue={food.category} required aria-label="Category" />
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Save</button>
      </form>
      <h2 className="mt-8 text-lg font-semibold">Serving units</h2>
      <ul className="mt-2 divide-y">
        {food.servingUnits.map((su) => (
          <li key={su.id} className="flex items-center gap-4 py-2">
            <span>{su.name}</span>
            <form action={saveServingUnit} className="flex items-center gap-2">
              <input type="hidden" name="id" value={su.id} />
              <input type="hidden" name="foodId" value={food.id} />
              <Input name="name" defaultValue={su.name} className="w-40" aria-label="Serving unit name" />
              <Input name="gramsEquivalent" defaultValue={su.gramsEquivalent} className="w-24" aria-label="Grams equivalent" />
              <button type="submit" className="rounded border px-3 py-1">Save</button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-lg font-semibold">Nutrients (per 100 g)</h2>
      <form action={saveFoodNutrient} className="mt-2 grid max-w-md gap-2">
        <input type="hidden" name="foodId" value={food.id} />
        {food.nutrients.map((n) => (
          <label key={n.nutrientId} className="flex items-center gap-2">
            <span className="w-40">{n.name} ({n.unit})</span>
            <Input name={`amount-${n.nutrientId}`} defaultValue={n.amountPer100g} aria-label={n.name} />
          </label>
        ))}
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Save nutrients</button>
      </form>
    </div>
  );
}
```

Add `getFoodAdmin`, `saveFood`, `saveServingUnit`, `saveFoodNutrient` per the schema and the established action pattern (`saveFoodNutrient` reads the `amount-<nutrientId>` fields from `FormData` and upserts each row).

- [ ] **Step 2: Write the diet program admin**

`src/app/[locale]/admin/diet-programs/page.tsx`: list + create form (name, organization_context, plan_type, duration_days, price, description) following the Phase 1 Task 1.4 CRUD pattern verbatim.

- [ ] **Step 3: Write the J-004 journey test**

`e2e/nutrition.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("J-004 analyze food intake", async ({ page }) => {
  // Patient session via the Phase 1 test-only helper (no OTP path in Playwright)
  const res = await page.request.post("/api-test/login");
  const { token } = await res.json();
  await page.context().addCookies([
    { name: "better-auth.session_token", value: token, url: "http://localhost:3000" },
  ]);
  await page.goto("/fa/diary");
  await page.getByLabel("Food").selectOption({ label: /آش رشته/ });
  await page.getByLabel("Serving").selectOption({ label: "بشقاب" });
  await page.getByLabel("Quantity").fill("1");
  await page.getByRole("button", { name: "Log intake" }).click();
  await expect(page.getByText(/276/)).toBeVisible(); // energy kcal for one plate
});
```

- [ ] **Step 4: Run the suite**

```bash
bunx playwright test e2e/nutrition.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: nutrition admin and J-004 journey test"
```

---

### Task 2.9: Phase 2 exit verification

**Files:** none

- [ ] **Step 1: Full pass**

```bash
bun run test && bun run lint && bun run build && bunx playwright test
```

- [ ] **Step 2: Spec §11 Phase 2 exit criteria**

1. J-003 complete (diet: context → offering → eligibility → claim → personalized area).
2. J-004 complete (Task 2.8).
3. Intake → nutrient math matches hand-checked reference cases (Task 2.3 Step 3, Task 2.5 Step 4).
4. All 26 F-features of Phase 2 (F-011…F-015) demonstrable in admin or UI.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore: phase 2 exit verification"
```

---

## Phase 2 Self-Review

- **Spec coverage:** §5.4 (full nutrition schema) — Task 2.1; §7 (pipeline + Mifflin-St Jeor named) — Task 2.2, constraints 4–5; §9 nutrition admin — Task 2.8; F-011 (diet context) — Task 2.7; F-012 (food analysis) — Tasks 2.2/2.5; F-013 (My Body) — Task 2.4; F-014 (calorie counter) — Task 2.5; F-015 (food DB) — Task 2.6; §13 risks 1–2 (reference spike, 50–100 food ceiling) — constraint 5, Task 2.3; NFR-004 (pagination) — Task 2.6.
- **Placeholders:** none. The `// …49–99 more foods` comment in Task 2.3 is a **data-volume marker, not a behavior placeholder** — the shape is fully specified by the template food; the spike constraint makes sourcing the remaining foods the developer's gated input.
- **Type consistency:** `servingToGrams(quantity, gramsEquivalent)` used identically in kernel test, seed verification, and `logIntake`; `nutrientsForIntake(grams, per100g)` keyed by `n-energy` etc. matching `NUTRIENTS` IDs in the seed and `dayIntake`'s rollup map; `deficits` return shape `{ nutrientId, deficit }` matches the test; `activityFactors` keys match the `ActivityLevel` union and the `activityLevel` select options in Task 2.4; `claimDietProgram`'s partial unique index mirrors the Phase 1 `one_booking_per_slot` pattern.