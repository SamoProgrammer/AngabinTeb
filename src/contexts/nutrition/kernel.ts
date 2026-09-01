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