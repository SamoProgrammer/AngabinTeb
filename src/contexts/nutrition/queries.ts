import "server-only";
import { sql, eq, and, gte, lt, inArray } from "drizzle-orm";
import { db } from "@/db";
import { physiologyProfiles, foodIntakes, foods, servingUnits, nutrients, foodNutrients, dailyNutrition, dietPrograms, dietClaims, translations, providers } from "@/db/schema";
import { overlayTranslations } from "@/lib/translate";
import { bmr, tdee, type ActivityLevel } from "./kernel";
import type { FoodCard, FoodDetail, FoodOption, ProgramCard } from "./model";

async function fetchDietOverrides(entityType: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, entityType), inArray(translations.entityId, ids)));
}

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

export async function dayIntake(userId: string, day: string) {
  const start = `${day}T00:00:00Z`;
  const nextDay = new Date(start);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
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
      lt(foodIntakes.loggedAt, nextDay),
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

export async function searchFoods(_locale: string, term: string, category?: string, page = 1): Promise<{ rows: FoodCard[]; total: number }> {
  const where = and(
    term.trim() ? sql`to_tsvector('simple', ${foods.name}) @@ plainto_tsquery('simple', ${term.trim()})` : undefined,
    category ? eq(foods.category, category) : undefined,
  );
  const rows = await db
    .select({ id: foods.id, name: foods.name, category: foods.category })
    .from(foods)
    .where(where)
    .orderBy(foods.name)
    .limit(20)
    .offset((page - 1) * 20);
  const [count] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(foods)
    .where(where);
  return { rows, total: count?.total ?? 0 };
}

export async function getFoodDetail(id: string, _locale: string): Promise<FoodDetail | null> {
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) return null;
  const [servingUnitsRows, nutrientRows] = await Promise.all([
    db
      .select({ id: servingUnits.id, name: servingUnits.name, gramsEquivalent: servingUnits.gramsEquivalent })
      .from(servingUnits)
      .where(eq(servingUnits.foodId, id))
      .orderBy(servingUnits.name),
    db
      .select({
        nutrientId: foodNutrients.nutrientId,
        name: nutrients.name,
        unit: nutrients.unit,
        amountPer100g: foodNutrients.amountPer100g,
      })
      .from(foodNutrients)
      .innerJoin(nutrients, eq(foodNutrients.nutrientId, nutrients.id))
      .where(eq(foodNutrients.foodId, id))
      .orderBy(nutrients.name),
  ]);
  return {
    id: food.id,
    name: food.name,
    category: food.category,
    servingUnits: servingUnitsRows,
    nutrients: nutrientRows,
  };
}

export async function getFoodAdmin(id: string) {
  const [food] = await db.select().from(foods).where(eq(foods.id, id));
  if (!food) return null;
  const [servingUnitsRows, nutrientRows] = await Promise.all([
    db
      .select({ id: servingUnits.id, name: servingUnits.name, gramsEquivalent: servingUnits.gramsEquivalent })
      .from(servingUnits)
      .where(eq(servingUnits.foodId, id))
      .orderBy(servingUnits.name),
    db
      .select({
        nutrientId: foodNutrients.nutrientId,
        name: nutrients.name,
        unit: nutrients.unit,
        amountPer100g: foodNutrients.amountPer100g,
      })
      .from(foodNutrients)
      .innerJoin(nutrients, eq(foodNutrients.nutrientId, nutrients.id))
      .where(eq(foodNutrients.foodId, id))
      .orderBy(nutrients.name),
  ]);
  return { ...food, servingUnits: servingUnitsRows, nutrients: nutrientRows };
}

export async function foodPickerOptions(_locale: string): Promise<FoodOption[]> {
  const rows = await db
    .select({
      id: foods.id,
      name: foods.name,
      servingUnitId: servingUnits.id,
      servingUnitName: servingUnits.name,
    })
    .from(foods)
    .leftJoin(servingUnits, eq(servingUnits.foodId, foods.id))
    .orderBy(foods.name);
  const map = new Map<string, FoodOption>();
  for (const row of rows) {
    const option = map.get(row.id) ?? { id: row.id, name: row.name, servingUnits: [] };
    if (row.servingUnitId && row.servingUnitName) option.servingUnits.push({ id: row.servingUnitId, name: row.servingUnitName });
    map.set(row.id, option);
  }
  return [...map.values()];
}

export async function listPrograms(context: string, locale: string): Promise<ProgramCard[]> {
  const rows = await db
    .select({
      id: dietPrograms.id,
      name: dietPrograms.name,
      description: dietPrograms.description,
      organizationContext: dietPrograms.organizationContext,
      planType: dietPrograms.planType,
      durationDays: dietPrograms.durationDays,
      price: dietPrograms.price,
      practitionerName: providers.name,
      practitionerPhone: providers.phone,
    })
    .from(dietPrograms)
    .leftJoin(providers, eq(dietPrograms.practitionerId, providers.id))
    .where(eq(dietPrograms.organizationContext, context))
    .orderBy(dietPrograms.name);
  return overlayTranslations("diet_program", rows, await fetchDietOverrides("diet_program", rows.map((r) => r.id)), locale, ["name", "description"]) as ProgramCard[];
}

export async function myClaims(userId: string): Promise<Array<{ programId: string; status: string }>> {
  return db
    .select({ programId: dietClaims.programId, status: dietClaims.status })
    .from(dietClaims)
    .where(and(eq(dietClaims.userId, userId), sql`${dietClaims.status} != 'completed'`));
}