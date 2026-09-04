import { describe, expect, it } from "vitest";
import {
  calculateBmr,
  calculateTdee,
  calculateBmi,
  calculateMacros,
  toPersianDigits,
  formatPersianNumber,
} from "@/lib/metabolism";

describe("Metabolism Engine (Mifflin-St Jeor)", () => {
  describe("calculateBmr", () => {
    it("calculates BMR for males correctly using Mifflin-St Jeor formula", () => {
      // 10 * 69 + 6.25 * 175 - 5 * 32 + 5 = 690 + 1093.75 - 160 + 5 = 1628.75 -> 1629
      const bmrMaleDefault = calculateBmr({
        gender: "male",
        weightKg: 69,
        heightCm: 175,
        ageYears: 32,
      });
      expect(bmrMaleDefault).toBe(1629);

      // 10 * 80 + 6.25 * 180 - 5 * 25 + 5 = 800 + 1125 - 125 + 5 = 1805
      const bmrMale2 = calculateBmr({
        gender: "male",
        weightKg: 80,
        heightCm: 180,
        ageYears: 25,
      });
      expect(bmrMale2).toBe(1805);
    });

    it("calculates BMR for females correctly using Mifflin-St Jeor formula", () => {
      // 10 * 60 + 6.25 * 165 - 5 * 30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320
      const bmrFemale = calculateBmr({
        gender: "female",
        weightKg: 60,
        heightCm: 165,
        ageYears: 30,
      });
      expect(bmrFemale).toBe(1320);

      // 10 * 55 + 6.25 * 160 - 5 * 25 - 161 = 550 + 1000 - 125 - 161 = 1264
      const bmrFemale2 = calculateBmr({
        gender: "female",
        weightKg: 55,
        heightCm: 160,
        ageYears: 25,
      });
      expect(bmrFemale2).toBe(1264);
    });

    it("returns 0 for non-positive input values", () => {
      expect(calculateBmr({ gender: "male", weightKg: 0, heightCm: 175, ageYears: 30 })).toBe(0);
      expect(calculateBmr({ gender: "female", weightKg: 60, heightCm: -10, ageYears: 30 })).toBe(0);
      expect(calculateBmr({ gender: "male", weightKg: 70, heightCm: 175, ageYears: 0 })).toBe(0);
    });
  });

  describe("calculateTdee", () => {
    it("multiplies BMR by activity factor accurately", () => {
      // 1629 * 1.375 = 2239.875 -> 2240
      expect(calculateTdee(1629, 1.375)).toBe(2240);

      // 1805 * 1.2 = 2166
      expect(calculateTdee(1805, 1.2)).toBe(2166);

      // 1320 * 1.55 = 2046
      expect(calculateTdee(1320, 1.55)).toBe(2046);

      // 1264 * 1.725 = 2180.4 -> 2180
      expect(calculateTdee(1264, 1.725)).toBe(2180);

      // 1500 * 1.9 = 2850
      expect(calculateTdee(1500, 1.9)).toBe(2850);
    });

    it("handles zero BMR or zero multiplier gracefully", () => {
      expect(calculateTdee(0, 1.375)).toBe(0);
      expect(calculateTdee(1629, 0)).toBe(0);
    });
  });

  describe("calculateBmi", () => {
    it("calculates BMI and categorizes correctly", () => {
      // Normal weight
      const normal = calculateBmi(69, 175);
      expect(normal.bmi).toBe(22.5);
      expect(normal.label).toBe("محدوده ایده‌آل و طبیعی");

      // Underweight (< 18.5)
      const under = calculateBmi(45, 170);
      expect(under.bmi).toBe(15.6);
      expect(under.label).toBe("کمبود وزن (لاغری)");

      // Overweight (25 - 29.9)
      const over = calculateBmi(85, 175);
      expect(over.bmi).toBe(27.8);
      expect(over.label).toBe("اضافه‌وزن خفیف");

      // Obese (>= 30)
      const obese = calculateBmi(105, 175);
      expect(obese.bmi).toBe(34.3);
      expect(obese.label).toBe("محدوده چاقی بالینی");
    });

    it("handles BMI threshold edge cases accurately", () => {
      // Exactly below 18.5
      expect(calculateBmi(50, 165).label).toBe("کمبود وزن (لاغری)");
      // Exactly 18.5 or slightly above
      expect(calculateBmi(55, 172).label).toBe("محدوده ایده‌آل و طبیعی");
      // Around 24.9 - 25.0
      expect(calculateBmi(75, 174).label).toBe("محدوده ایده‌آل و طبیعی");
      expect(calculateBmi(76, 174).label).toBe("اضافه‌وزن خفیف");
      // Around 29.9 - 30.0
      expect(calculateBmi(90, 174).label).toBe("اضافه‌وزن خفیف");
      expect(calculateBmi(92, 174).label).toBe("محدوده چاقی بالینی");
    });

    it("handles non-positive inputs safely", () => {
      const invalid = calculateBmi(0, 170);
      expect(invalid.bmi).toBe(0);
      expect(invalid.label).toBe("نامشخص");
    });
  });

  describe("calculateMacros", () => {
    it("splits daily energy into 25% protein, 50% carbs, and 25% fats", () => {
      const macros = calculateMacros(2240);
      // Protein: 2240 * 0.25 / 4 = 140g
      expect(macros.proteinGrams).toBe(140);
      // Carbs: 2240 * 0.50 / 4 = 280g
      expect(macros.carbGrams).toBe(280);
      // Fat: 2240 * 0.25 / 9 = 62.22 -> 62g
      expect(macros.fatGrams).toBe(62);
    });

    it("handles zero TDEE", () => {
      const macros = calculateMacros(0);
      expect(macros.proteinGrams).toBe(0);
      expect(macros.carbGrams).toBe(0);
      expect(macros.fatGrams).toBe(0);
    });
  });

  describe("Persian formatting helpers", () => {
    it("converts digits to Persian numbers", () => {
      expect(toPersianDigits("12345")).toBe("۱۲۳۴۵");
      expect(toPersianDigits(1629)).toBe("۱۶۲۹");
      expect(toPersianDigits(null)).toBe("");
    });

    it("formats Persian numbers with thousands and decimal separators", () => {
      expect(formatPersianNumber(1629)).toBe("۱٬۶۲۹");
      expect(formatPersianNumber(2240)).toBe("۲٬۲۴۰");
      expect(formatPersianNumber(22.5, { decimals: 1 })).toBe("۲۲٫۵");
    });
  });
});
