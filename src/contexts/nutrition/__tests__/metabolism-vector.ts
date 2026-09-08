// Shared numeric vector: asserted through BOTH adapters (client widget math
// via lib/metabolism and persisted diary targets via queries.ts getPhysiology).
// Hand-computed, never derived from the code under test:
//   BMR  = 10×75 + 6.25×180 − 5×40 + 5 = 750 + 1125 − 200 + 5 = 1680
//   TDEE = 1680 × 1.55 (moderate) = 2604
//   BMI  = 75 / 1.8² = 23.148… → 23.1 (ideal range)
//   macros(2604) = protein 162.75 → 163, carbs 325.5 → 326, fat 72.33… → 72
export const metabolismVector = {
  sex: "male",
  gender: "male",
  weightKg: 75,
  heightCm: 180,
  age: 40,
  ageYears: 40,
  activityLevel: "moderate",
  activityFactor: 1.55,
} as const;

export const metabolismExpected = {
  rawBmr: 1680,
  roundedBmr: 1680,
  roundedTdee: 2604,
  rawBmi: 75 / 3.24,
  roundedBmi: 23.1,
  bmiLabel: "محدوده ایده‌آل و طبیعی",
  macros: { proteinGrams: 163, carbGrams: 326, fatGrams: 72 },
};
