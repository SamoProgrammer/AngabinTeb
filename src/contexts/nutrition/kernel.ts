export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

export const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export type Sex = "male" | "female";

export interface BodyParams {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}

export interface MacroSplit {
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

// Canonical raw equations (Mifflin-St Jeor). No guards, no rounding —
// adapters (client widget via lib/metabolism, server via queries.ts) own that.
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

export function bmr(input: BodyParams): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return input.sex === "male" ? base + 5 : base - 161;
}

export function tdeeForFactor(bmrValue: number, factor: number): number {
  return bmrValue * factor;
}

export function tdee(bmrValue: number, level: ActivityLevel): number {
  return tdeeForFactor(bmrValue, activityFactors[level]);
}

export function bmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export function macroSplit(tdeeValue: number): MacroSplit {
  return {
    proteinGrams: (tdeeValue * 0.25) / 4,
    carbGrams: (tdeeValue * 0.5) / 4,
    fatGrams: (tdeeValue * 0.25) / 9,
  };
}

export function deficits(
  actual: Record<string, number>,
  required: Record<string, number>,
): Array<{ nutrientId: string; deficit: number }> {
  return Object.entries(required)
    .filter(([id, req]) => (actual[id] ?? 0) < req)
    .map(([id, req]) => ({ nutrientId: id, deficit: req - (actual[id] ?? 0) }));
}

// Paid-claim gate (ticket 13 / spec F1). Free programs (price 0) are open;
// priced programs serve their download only to users holding a claim row
// (any status: pending/active/completed all count — owners re-access).
// Pure so the gate is unit-testable; getProgramContent wires it to the DB.
export function isPricedProgram(price: string | number): boolean {
  return Number(price) > 0;
}

export function canAccessProgramContent(price: string | number, hasClaim: boolean): boolean {
  if (!isPricedProgram(price)) return true;
  return hasClaim;
}

// Calorie-period input guard. Pure (lives here, not in actions.ts, so the
// "use server" module only exports async actions) and unit-tested directly.
export function validatePeriodInput(input: { title: string; startsOn: string; endsOn: string }) {
  const title = input.title?.trim() ?? "";
  if (title.length < 1 || title.length > 80) return { ok: false as const, error: "invalid title" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endsOn)) {
    return { ok: false as const, error: "invalid dates" };
  }
  const start = new Date(`${input.startsOn}T00:00:00Z`);
  const end = new Date(`${input.endsOn}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { ok: false as const, error: "invalid dates" };
  }
  if (start.toISOString().slice(0, 10) !== input.startsOn || end.toISOString().slice(0, 10) !== input.endsOn) {
    return { ok: false as const, error: "invalid dates" };
  }
  if (end < start) return { ok: false as const, error: "end before start" };
  const spanDays = Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000)) + 1;
  if (spanDays > 62) return { ok: false as const, error: "period too long" };
  return { ok: true as const, data: { title, startsOn: input.startsOn, endsOn: input.endsOn } };
}

export const SNAPSHOT_COLUMNS = [
  "personInfo", "medicalHistory", "drugHistory", "addictionHistory",
  "nutritionInfo", "cardiovascularQuestions", "anthropometric", "medicalDocuments",
] as const;

export function toSnapshotValues(registry: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(SNAPSHOT_COLUMNS.map((c) => [c, registry[c] ?? null]));
}

export function missingRegistrySections(row: Record<string, unknown>): string[] {
  return (SNAPSHOT_COLUMNS as readonly string[]).filter((c) => row[c] == null);
}

export const CLAIM_STATUSES = ["pending", "paid", "generating", "needs_review", "ready", "failed", "completed"] as const;

export function nextGenerationStatus(opts: { ok: boolean; retryCount: number }): "needs_review" | "generating" | "failed" {
  if (opts.ok) return "needs_review";
  return opts.retryCount + 1 >= 3 ? "failed" : "generating";
}

const ADMIN_TRANSITIONS: Record<string, string[]> = {
  generating: ["generating"],
  needs_review: ["ready", "generating"],
  failed: ["generating", "ready"],
  paid: ["generating"],
};

export function allowedClaimTransition(from: string, to: string): boolean {
  return ADMIN_TRANSITIONS[from]?.includes(to) ?? false;
}
