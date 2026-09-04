const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

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
 * Calculates Basal Metabolic Rate (BMR) using the clinical Mifflin-St Jeor equation.
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
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const raw = gender === "male" ? base + 5 : base - 161;
  return Math.round(Math.max(0, raw));
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on BMR and physical activity factor.
 */
export function calculateTdee(bmr: number, activityMultiplier: number): number {
  if (bmr <= 0 || activityMultiplier <= 0) {
    return 0;
  }
  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculates Body Mass Index (BMI) and returns clinical status label in Persian.
 */
export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  if (weightKg <= 0 || heightCm <= 0) {
    return { bmi: 0, label: "نامشخص" };
  }

  const heightM = heightCm / 100;
  const rawBmi = weightKg / (heightM * heightM);
  const bmi = Math.round(rawBmi * 10) / 10;

  let label: string;
  if (bmi < 18.5) {
    label = "کمبود وزن (لاغری)";
  } else if (bmi < 25) {
    label = "محدوده ایده‌آل و طبیعی";
  } else if (bmi < 30) {
    label = "اضافه‌وزن خفیف";
  } else {
    label = "محدوده چاقی بالینی";
  }

  return { bmi, label };
}

/**
 * Calculates macronutrient target grams based on daily TDEE (25% protein, 50% carbs, 25% fats).
 * Protein: 4 kcal/g
 * Carbs: 4 kcal/g
 * Fat: 9 kcal/g
 */
export function calculateMacros(tdee: number): MacroSplit {
  if (tdee <= 0) {
    return { proteinGrams: 0, carbGrams: 0, fatGrams: 0 };
  }
  const proteinGrams = Math.round((tdee * 0.25) / 4);
  const carbGrams = Math.round((tdee * 0.5) / 4);
  const fatGrams = Math.round((tdee * 0.25) / 9);

  return { proteinGrams, carbGrams, fatGrams };
}

/**
 * Converts Western digits in a string or number to Persian digits.
 */
export function toPersianDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

/**
 * Formats a number with Persian thousands separators (٬) and optional decimal places (٫).
 */
export function formatPersianNumber(
  num: number,
  options?: { decimals?: number; useComma?: boolean }
): string {
  const decimals = options?.decimals ?? 0;
  const useComma = options?.useComma ?? true;

  const formattedEn = num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  let formatted = formattedEn;
  if (useComma) {
    formatted = formatted.replace(/,/g, "٬");
  }
  if (decimals > 0) {
    formatted = formatted.replace(/\./g, "٫");
  }

  return toPersianDigits(formatted);
}
