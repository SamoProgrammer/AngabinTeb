import { bmr, tdeeForFactor, bmi, macroSplit } from "@/contexts/nutrition/kernel";

export interface BmrParams {
  gender: "male" | "female";
  weightKg: number;
  heightCm: number;
  ageYears: number;
}

export interface BmiResult {
  bmi: number;
  label: string;
}

export interface MacroSplit {
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

/**
 * Client-widget adapter over the canonical Mifflin-St Jeor equation in
 * nutrition/kernel. Guards and rounding live here; the equation lives there.
 * Male: 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) + 5
 * Female: 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) - 161
 */
export function calculateBmr({
  gender,
  weightKg,
  heightCm,
  ageYears,
}: BmrParams): number {
  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) {
    return 0;
  }
  const raw = bmr({ sex: gender, weightKg, heightCm, age: ageYears });
  return Math.round(Math.max(0, raw));
}

/**
 * Client-widget adapter over the canonical activity-factor TDEE.
 */
export function calculateTdee(bmrValue: number, activityMultiplier: number): number {
  if (bmrValue <= 0 || activityMultiplier <= 0) {
    return 0;
  }
  return Math.round(tdeeForFactor(bmrValue, activityMultiplier));
}

/**
 * Client-widget adapter: canonical raw BMI plus rounding and Persian label.
 */
export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  if (weightKg <= 0 || heightCm <= 0) {
    return { bmi: 0, label: "نامشخص" };
  }

  const bmiValue = Math.round(bmi(weightKg, heightCm) * 10) / 10;

  let label: string;
  if (bmiValue < 18.5) {
    label = "کمبود وزن (لاغری)";
  } else if (bmiValue < 25) {
    label = "محدوده ایده‌آل و طبیعی";
  } else if (bmiValue < 30) {
    label = "اضافه‌وزن خفیف";
  } else {
    label = "محدوده چاقی بالینی";
  }

  return { bmi: bmiValue, label };
}

/**
 * Client-widget adapter: canonical macro split (25% protein, 50% carbs,
 * 25% fats; protein/carb 4 kcal/g, fat 9 kcal/g) plus rounding.
 */
export function calculateMacros(tdee: number): MacroSplit {
  if (tdee <= 0) {
    return { proteinGrams: 0, carbGrams: 0, fatGrams: 0 };
  }
  const raw = macroSplit(tdee);
  return {
    proteinGrams: Math.round(raw.proteinGrams),
    carbGrams: Math.round(raw.carbGrams),
    fatGrams: Math.round(raw.fatGrams),
  };
}
