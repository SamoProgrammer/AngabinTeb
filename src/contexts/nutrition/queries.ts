import "server-only";
import { cache } from "react";
import { sql, eq, and, gte, lt, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { physiologyProfiles, weightLogs, foodIntakes, foods, servingUnits, nutrients, foodNutrients, dailyNutrition, dietPrograms, dietClaims, dietDocuments, providers, intakePeriods, registrySnapshots, users, clinicalRegistries } from "@/db/schema";
import { localizedRows } from "@/lib/translate";
import { bmr, tdee, canAccessProgramContent, servingToGrams, nutrientsForIntake, sumDay, macroSplit, missingRegistrySections, SNAPSHOT_COLUMNS, type ActivityLevel } from "./kernel";
import type { FoodCard, FoodDetail, FoodOption, ProgramCard, ProgramContent } from "./model";

export const getPhysiology = cache(async (userId: string) => {
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
});

export const dayIntake = cache(async (userId: string, day: string) => {
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
});

export const searchFoods = cache(async (_locale: string, term: string, category?: string, page = 1): Promise<{ rows: FoodCard[]; total: number }> => {
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
});

export const getFoodDetail = cache(async (id: string, _locale: string): Promise<FoodDetail | null> => {
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
});

export const getFoodAdmin = cache(async (id: string) => {
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
});

export const foodPickerOptions = cache(async (_locale: string): Promise<FoodOption[]> => {
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
});

export const listPrograms = cache(async (context: string, locale: string): Promise<ProgramCard[]> => {
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
  return (await localizedRows("diet_program", rows, locale, ["name", "description"])) as ProgramCard[];
});

export const myClaims = cache(async (
  userId: string,
  dbc: typeof db = db,
): Promise<Array<{ programId: string; status: string }>> => {
  // All statuses: a completed claim is still ownership — owners re-access
  // without re-claiming, so completed rows must stay visible here.
  return dbc
    .select({ programId: dietClaims.programId, status: dietClaims.status })
    .from(dietClaims)
    .where(eq(dietClaims.userId, userId));
});

// Diet-claim registry for the profile list: claims joined to programs
// (inner) + documents (left), newest first, with the program name overlaid
// per locale and a hasDocument flag (no document row yet → false).
export const myDietClaims = cache(async (userId: string, locale: string) => {
  const rows = await db
    .select({
      claimId: dietClaims.id,
      programId: dietClaims.programId,
      programName: dietPrograms.name,
      status: dietClaims.status,
      pricePaid: dietClaims.pricePaid,
      organizationContext: dietClaims.organizationContext,
      createdAt: dietClaims.createdAt,
      documentId: dietDocuments.id,
    })
    .from(dietClaims)
    .innerJoin(dietPrograms, eq(dietClaims.programId, dietPrograms.id))
    .leftJoin(dietDocuments, eq(dietDocuments.claimId, dietClaims.id))
    .where(eq(dietClaims.userId, userId))
    .orderBy(desc(dietClaims.createdAt));

  const overlaid = await localizedRows(
    "diet_program",
    rows.map((r) => ({ id: r.programId, name: r.programName })),
    locale,
    ["name"],
  );
  const nameByProgramId = new Map<string, string>(overlaid.map((o) => [o.id, o.name]));
  return rows.map(({ documentId, ...r }) => ({
    ...r,
    programName: nameByProgramId.get(r.programId) ?? r.programName,
    hasDocument: documentId !== null,
  }));
});

// Admin claim queue: every claim joined to its program + claimant name,
// newest first. Snapshot left-joined for the queue's raw-JSON details view.
// ponytail: no pagination, add when queue exceeds 100
export const allClaims = cache(async () => {
  return db
    .select({
      claimId: dietClaims.id,
      userId: dietClaims.userId,
      userName: users.name,
      programId: dietClaims.programId,
      programName: dietPrograms.name,
      organizationContext: dietClaims.organizationContext,
      pricePaid: dietClaims.pricePaid,
      status: dietClaims.status,
      retryCount: dietClaims.retryCount,
      lastError: dietClaims.lastError,
      createdAt: dietClaims.createdAt,
      documentBody: dietDocuments.bodyMarkdown,
      snapshotId: registrySnapshots.id,
      personInfo: registrySnapshots.personInfo,
      medicalHistory: registrySnapshots.medicalHistory,
      drugHistory: registrySnapshots.drugHistory,
      addictionHistory: registrySnapshots.addictionHistory,
      nutritionInfo: registrySnapshots.nutritionInfo,
      cardiovascularQuestions: registrySnapshots.cardiovascularQuestions,
      anthropometric: registrySnapshots.anthropometric,
      medicalDocuments: registrySnapshots.medicalDocuments,
    })
    .from(dietClaims)
    .innerJoin(dietPrograms, eq(dietClaims.programId, dietPrograms.id))
    .innerJoin(users, eq(dietClaims.userId, users.id))
    .leftJoin(registrySnapshots, eq(registrySnapshots.claimId, dietClaims.id))
    .leftJoin(dietDocuments, eq(dietDocuments.claimId, dietClaims.id))
    .orderBy(desc(dietClaims.createdAt))
    .limit(100);
});

// Claim-gated serving point (ticket 13 / spec F1). The ONLY path that hands
// out a program's download: priced programs require a claim row (any status),
// otherwise downloadUrl is nulled server-side — hiding buttons is not enough.
// The optional db override mirrors the booking seam: tests run this against a
// disposable database without touching the dev database.
export const getProgramContent = cache(async (
  programId: string,
  userId: string,
  locale: string,
  dbc: typeof db = db,
): Promise<ProgramContent | null> => {
  const [row] = await dbc
    .select({
      id: dietPrograms.id,
      name: dietPrograms.name,
      description: dietPrograms.description,
      organizationContext: dietPrograms.organizationContext,
      planType: dietPrograms.planType,
      durationDays: dietPrograms.durationDays,
      price: dietPrograms.price,
      downloadUrl: dietPrograms.downloadUrl,
      practitionerName: providers.name,
      practitionerPhone: providers.phone,
    })
    .from(dietPrograms)
    .leftJoin(providers, eq(dietPrograms.practitionerId, providers.id))
    .where(eq(dietPrograms.id, programId));
  if (!row) return null;

  const claims = await dbc
    .select({ id: dietClaims.id })
    .from(dietClaims)
    .where(and(eq(dietClaims.userId, userId), eq(dietClaims.programId, programId)));
  const hasClaim = claims.length > 0;
  const allowed = canAccessProgramContent(row.price, hasClaim);

  const [overlaid] = await localizedRows(
    "diet_program",
    [row],
    locale,
    ["name", "description"],
    dbc,
  );
  return {
    ...(overlaid as typeof row),
    hasClaim,
    accessDenied: !allowed,
    downloadUrl: allowed ? row.downloadUrl : null,
  };
});

export const listPeriods = cache(async (userId: string) => {
  return db.select().from(intakePeriods)
    .where(eq(intakePeriods.userId, userId))
    .orderBy(desc(intakePeriods.startsOn));
});

export const getPeriod = cache(async (userId: string, id: string) => {
  const [row] = await db.select().from(intakePeriods)
    .where(and(eq(intakePeriods.id, id), eq(intakePeriods.userId, userId)));
  return row ?? null;
});

export const periodEntries = cache(async (userId: string, periodId: string) => {
  return db.select({
    id: foodIntakes.id, foodName: foods.name, servingUnitName: servingUnits.name,
    quantity: foodIntakes.quantity, mealSlot: foodIntakes.mealSlot, loggedAt: foodIntakes.loggedAt,
    gramsEquivalent: servingUnits.gramsEquivalent, foodId: foodIntakes.foodId,
  }).from(foodIntakes)
    .innerJoin(foods, eq(foodIntakes.foodId, foods.id))
    .innerJoin(servingUnits, eq(foodIntakes.servingUnitId, servingUnits.id))
    .where(and(eq(foodIntakes.userId, userId), eq(foodIntakes.periodId, periodId)))
    .orderBy(foodIntakes.loggedAt);
});

export const periodTotals = cache(async (userId: string, periodId: string) => {
  const period = await getPeriod(userId, periodId);
  if (!period) return null;
  const entries = await periodEntries(userId, periodId);
  const foodIds = [...new Set(entries.map((e) => e.foodId))];
  const per100gByFood = new Map<string, Record<string, number>>();
  if (foodIds.length > 0) {
    const rows = await db.select().from(foodNutrients).where(inArray(foodNutrients.foodId, foodIds));
    for (const r of rows) {
      const map = per100gByFood.get(r.foodId) ?? {};
      map[r.nutrientId] = Number(r.amountPer100g);
      per100gByFood.set(r.foodId, map);
    }
  }
  const rows = entries.map((e) =>
    nutrientsForIntake(
      servingToGrams(Number(e.quantity), Number(e.gramsEquivalent)),
      per100gByFood.get(e.foodId) ?? {},
    ),
  );
  const totals = sumDay(rows);
  const bmrValue = bmr({
    sex: period.sex as "male" | "female",
    weightKg: Number(period.weightKg),
    heightCm: Number(period.heightCm),
    age: period.age,
  });
  const tdeeValue = tdee(bmrValue, period.activityLevel as ActivityLevel);
  return {
    totals,
    bmr: Math.round(bmrValue),
    tdee: Math.round(tdeeValue),
    macros: macroSplit(tdeeValue),
    entryCount: entries.length,
  };
});

// Weigh-in history for the profile body page (Task 6c). Ascending, capped
// at 60 rows.
// ponytail: server-side SVG chart later; plain list for now
export const weightHistory = cache(async (userId: string) => {
  return db.select().from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(weightLogs.loggedAt)
    .limit(60);
});

// Registry completeness for the diet wizard check step (Task 6b): a dossier
// counts as complete only once submitted; otherwise the missing snapshot
// sections are listed so the UI can point back at the clinical form.
export const getRegistryStatus = cache(async (userId: string) => {
  const [row] = await db.select().from(clinicalRegistries).where(eq(clinicalRegistries.userId, userId));
  if (!row || !row.submittedAt) return { complete: false as const, missingSections: row ? missingRegistrySections(row) : [...SNAPSHOT_COLUMNS] };
  return { complete: true as const, missingSections: [] as string[] };
});

// Wizard step 1: distinct clinical program types for the type cards.
export const listProgramTypes = cache(async (): Promise<string[]> => {
  const rows = await db
    .selectDistinct({ planType: dietPrograms.planType })
    .from(dietPrograms)
    .orderBy(dietPrograms.planType);
  return rows.map((r) => r.planType);
});

// Wizard step 2: programs of one type — same card shape + overlay pattern as
// listPrograms (which filters by org context, signature untouched).
export const listProgramsByType = cache(async (planType: string, locale: string): Promise<ProgramCard[]> => {
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
    .where(eq(dietPrograms.planType, planType))
    .orderBy(dietPrograms.name);
  return (await localizedRows("diet_program", rows, locale, ["name", "description"])) as ProgramCard[];
});

// Wizard steps 4–5: one claim of THIS user joined to its program. Another
// user's claim id yields null so callers can notFound() without leaking.
// Program name/description are overlaid per locale (fa overlay is identity).
export const getMyClaim = cache(async (userId: string, claimId: string, locale: string) => {
  const [row] = await db
    .select({
      claimId: dietClaims.id,
      status: dietClaims.status,
      pricePaid: dietClaims.pricePaid,
      organizationContext: dietClaims.organizationContext,
      createdAt: dietClaims.createdAt,
      programId: dietPrograms.id,
      programName: dietPrograms.name,
      programDescription: dietPrograms.description,
      planType: dietPrograms.planType,
      durationDays: dietPrograms.durationDays,
      price: dietPrograms.price,
    })
    .from(dietClaims)
    .innerJoin(dietPrograms, eq(dietClaims.programId, dietPrograms.id))
    .where(and(eq(dietClaims.id, claimId), eq(dietClaims.userId, userId)));
  if (!row) return null;
  const [overlaid] = await localizedRows(
    "diet_program",
    [{ id: row.programId, name: row.programName, description: row.programDescription }],
    locale,
    ["name", "description"],
  );
  return {
    ...row,
    programName: overlaid?.name ?? row.programName,
    programDescription: overlaid?.description ?? row.programDescription,
  };
});
