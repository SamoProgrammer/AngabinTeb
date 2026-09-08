import { describe, expect, it } from "vitest";
import type { RequirementRow } from "../kernel";
import {
  servingToGrams, nutrientsForIntake, sumDay, requirementFor,
  bmr, tdee, tdeeForFactor, bmi, macroSplit, deficits,
} from "../kernel";
import { calculateBmr, calculateTdee, calculateBmi, calculateMacros } from "@/lib/metabolism";
import { metabolismVector as v, metabolismExpected as e } from "./metabolism-vector";

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
  const table: RequirementRow[] = [
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
    expect(bmr({ sex: "male", weightKg: 75, heightCm: 175, age: 30 })).toBeCloseTo(1698.75, 2);
  });
  it("computes TDEE from BMR and activity", () => {
    expect(tdee(bmr({ sex: "male", weightKg: 75, heightCm: 175, age: 30 }), "moderate"))
      .toBeCloseTo(1698.75 * 1.55, 2);
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

describe("shared vector: server diary-target adapter agrees with widget adapter", () => {
  const rawBmr = bmr({ sex: v.sex, weightKg: v.weightKg, heightCm: v.heightCm, age: v.age });

  it("computes the canonical raw BMR/BMI/macro values", () => {
    expect(rawBmr).toBeCloseTo(e.rawBmr, 2);
    expect(tdee(rawBmr, v.activityLevel)).toBeCloseTo(e.roundedTdee, 2);
    expect(tdeeForFactor(rawBmr, v.activityFactor)).toBeCloseTo(e.roundedTdee, 2);
    expect(bmi(v.weightKg, v.heightCm)).toBeCloseTo(e.rawBmi, 4);
    const macros = macroSplit(e.roundedTdee);
    expect(macros.proteinGrams).toBeCloseTo(162.75, 2);
    expect(macros.carbGrams).toBeCloseTo(325.5, 2);
    expect(macros.fatGrams).toBeCloseTo(72.333, 2);
  });

  it("diary-target rounding matches the widget adapter exactly", () => {
    // Same rounding queries.ts getPhysiology applies before persisting targets.
    const diaryBmr = Math.round(rawBmr);
    const diaryTdee = Math.round(tdee(rawBmr, v.activityLevel));
    expect(diaryBmr).toBe(e.roundedBmr);
    expect(diaryTdee).toBe(e.roundedTdee);
    expect(diaryBmr).toBe(
      calculateBmr({ gender: v.gender, weightKg: v.weightKg, heightCm: v.heightCm, ageYears: v.ageYears }),
    );
    expect(diaryTdee).toBe(calculateTdee(diaryBmr, v.activityFactor));
    expect(calculateBmi(v.weightKg, v.heightCm)).toEqual({ bmi: e.roundedBmi, label: e.bmiLabel });
    expect(calculateMacros(diaryTdee)).toEqual(e.macros);
  });
});