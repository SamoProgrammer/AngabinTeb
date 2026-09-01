import { describe, expect, it } from "vitest";
import type { RequirementRow } from "../kernel";
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