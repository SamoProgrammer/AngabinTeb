"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Calculator,
  Coffee,
  CookingPot,
  Hand,
  HandPlatter,
  Ruler,
  Square,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  calculateBmr,
  calculateTdee,
  calculateBmi,
  calculateMacros,
  toPersianDigits,
} from "@/lib/metabolism";

const PERSIAN_PORTIONS: Array<{
  nameKey: string;
  examplesKey: string;
  grams: number;
  calories: number;
  carbs: number;
  icon: LucideIcon;
}> = [
  { nameKey: "termsPortion1Name", examplesKey: "termsPortion1Examples", grams: 30, calories: 80, carbs: 15, icon: Hand },
  { nameKey: "termsPortion2Name", examplesKey: "termsPortion2Examples", grams: 25, calories: 45, carbs: 10, icon: CookingPot },
  { nameKey: "termsPortion3Name", examplesKey: "termsPortion3Examples", grams: 150, calories: 250, carbs: 55, icon: UtensilsCrossed },
  { nameKey: "termsPortion4Name", examplesKey: "termsPortion4Examples", grams: 240, calories: 120, carbs: 12, icon: Coffee },
  { nameKey: "termsPortion5Name", examplesKey: "termsPortion5Examples", grams: 30, calories: 75, carbs: 1, icon: Square },
  { nameKey: "termsPortion6Name", examplesKey: "termsPortion6Examples", grams: 250, calories: 320, carbs: 18, icon: HandPlatter },
];

export default function FoodAnalysisTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const searchParams = useSearchParams();
  const t = useTranslations("metabolism");
  const dir = locale === "en" ? "ltr" : "rtl";
  const digit2 = locale === "en" ? "2" : locale === "ar" ? "٢" : "۲";

  const num = (v: number | string) => (locale === "en" ? String(v) : toPersianDigits(v));

  const gender = (searchParams.get("gender") as "male" | "female") || "male";
  const age = Number(searchParams.get("age") || 30);
  const height = Number(searchParams.get("height") || 175);
  const weight = Number(searchParams.get("weight") || 75);
  const activity = Number(searchParams.get("activity") || 1.375);
  const goal = searchParams.get("goal") || "loss";

  const bmr = calculateBmr({
    gender,
    ageYears: age,
    heightCm: height,
    weightKg: weight,
  });

  const tdee = calculateTdee(bmr, activity);
  const bmiData = calculateBmi(weight, height);
  const bmiLabel =
    bmiData.bmi < 18.5
      ? t("bmiUnderweight")
      : bmiData.bmi < 25
        ? t("bmiNormal")
        : bmiData.bmi < 30
          ? t("bmiOverweight")
          : t("bmiObese");

  // Goal adjustments
  let targetCalories = tdee;
  let goalLabel = t("termsGoalMaintain");
  if (goal === "loss") {
    targetCalories = Math.max(1200, tdee - 500);
    goalLabel = t("termsGoalLoss");
  } else if (goal === "gain") {
    targetCalories = tdee + 400;
    goalLabel = t("termsGoalGain");
  } else if (goal === "diabetes") {
    targetCalories = Math.max(1300, tdee - 300);
    goalLabel = t("termsGoalDiabetes");
  }

  const macros = calculateMacros(targetCalories);

  // Portion Interactive Converter
  const [selectedPortionIdx, setSelectedPortionIdx] = useState(0);
  const [portionCount, setPortionCount] = useState(2);

  const selectedPortion = PERSIAN_PORTIONS[selectedPortionIdx];
  const computedCalories = selectedPortion.calories * portionCount;
  const computedCarbs = selectedPortion.carbs * portionCount;

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("termsHome")}
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/food-analysis/personal`} className="hover:text-primary transition-colors">
            {t("termsStep1")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("termsCrumb")}
          </span>
        </div>

        {/* Funnel Progress Indicator */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-on-surface-variant/60">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <span className="text-xs hidden sm:inline">
              {t("termsBiometricsDone")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
              {digit2}
            </div>
            <div className="flex flex-col text-start">
              <span className="text-xs sm:text-sm font-bold text-on-surface">
                {t("termsPrescriptionTitle")}
              </span>
              <span className="text-[11px] text-primary font-semibold">
                {t("termsMifflinBadge")}
              </span>
            </div>
          </div>
        </div>

        {/* Metabolic Dashboard Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-tier-2 border border-outline-variant/30">
          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface mb-2 text-start">
            {t("termsDashboardTitle")}
          </h1>
          <p className="text-xs text-on-surface-variant mb-6 text-start">
            {t("termsGoalPrefix")}
            <span className="font-bold text-primary">{goalLabel}</span>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col text-center">
              <span className="text-[11px] text-on-surface-variant">
                {t("termsBmiTitle")}
              </span>
              <span className="text-xl font-black text-on-surface mt-1">
                {num(bmiData.bmi)}
              </span>
              <span className="text-[10px] text-primary font-bold mt-0.5">
                {bmiLabel}
              </span>
            </div>

            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col text-center">
              <span className="text-[11px] text-on-surface-variant">
                {t("termsBmrTitle")}
              </span>
              <span className="text-xl font-black text-on-surface mt-1">
                {num(bmr)}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">
                {t("termsBmrSub")}
              </span>
            </div>

            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col text-center">
              <span className="text-[11px] text-on-surface-variant">
                {t("termsTdeeTitle")}
              </span>
              <span className="text-xl font-black text-on-surface mt-1">
                {num(tdee)}
              </span>
              <span className="text-[10px] text-on-surface-variant mt-0.5">
                {t("termsTdeeSub")}
              </span>
            </div>

            <div className="bg-primary/10 p-4 rounded-2xl border border-primary/30 flex flex-col text-center">
              <span className="text-[11px] text-primary font-bold">
                {t("termsTargetTitle")}
              </span>
              <span className="text-xl font-black text-primary mt-1">
                {num(targetCalories)}
              </span>
              <span className="text-[10px] text-primary mt-0.5">
                {t("termsTargetSub")}
              </span>
            </div>
          </div>

          {/* Macro Split Strip */}
          <div className="p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
            <span className="text-xs font-bold text-on-surface text-start">
              {t("termsMacroSplitTitle")}
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/15">
                <span className="text-on-surface-variant text-[10px] block">
                  {t("termsProteinSplit")}
                </span>
                <span className="font-bold text-on-surface">
                  {num(macros.proteinGrams)} {t("termsGramUnit")}
                </span>
              </div>
              <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/15">
                <span className="text-on-surface-variant text-[10px] block">
                  {t("termsCarbsSplit")}
                </span>
                <span className="font-bold text-on-surface">
                  {num(macros.carbGrams)} {t("termsGramUnit")}
                </span>
              </div>
              <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/15">
                <span className="text-on-surface-variant text-[10px] block">
                  {t("termsFatsSplit")}
                </span>
                <span className="font-bold text-on-surface">
                  {num(macros.fatGrams)} {t("termsGramUnit")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Persian Portion Units Guide */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-tier-2 border border-outline-variant/30 text-start">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <Ruler size={22} className="text-primary" aria-hidden="true" />
              <span>
                {t("termsPortionsTitle")}
              </span>
            </h2>
            <span className="text-[11px] bg-secondary-container/20 text-secondary px-2.5 py-0.5 rounded-full font-bold">
              {t("termsNoScaleBadge")}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
            {t("termsPortionsIntro")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {PERSIAN_PORTIONS.map((portion, idx) => (
              <div
                key={idx}
                className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <portion.icon size={18} aria-hidden="true" />
                    </div>
                    <h3 className="text-xs font-bold text-on-surface">{t(portion.nameKey)}</h3>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mb-2">
                    {t("termsExamplesPrefix")}
                    {t(portion.examplesKey)}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 text-[11px]">
                  <span className="text-on-surface-variant">
                    {t("termsEquivalentPrefix")} {num(portion.grams)} {t("termsGramUnit")}
                  </span>
                  <span className="font-bold text-primary">
                    {num(portion.calories)} {t("termsCalUnit")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Calculator Box */}
          <div className="p-5 bg-surface-container-low rounded-2xl border-2 border-primary/20 flex flex-col gap-4">
            <h3 className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
              <Calculator size={20} className="text-primary" aria-hidden="true" />
              <span>
                {t("termsCalculatorTitle")}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface-variant">
                  {t("termsSelectUnit")}
                </label>
                <select
                  value={selectedPortionIdx}
                  onChange={(e) => setSelectedPortionIdx(Number(e.target.value))}
                  className="bg-surface-container-lowest text-xs text-on-surface p-2.5 rounded-xl border border-outline-variant/30"
                >
                  {PERSIAN_PORTIONS.map((portion, i) => (
                    <option key={i} value={i}>
                      {t(portion.nameKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-on-surface-variant">
                  {t("termsUnitCount")}
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="20"
                  value={portionCount}
                  onChange={(e) => setPortionCount(Math.max(0.5, Number(e.target.value)))}
                  className="bg-surface-container-lowest text-xs text-on-surface p-2.5 rounded-xl border border-outline-variant/30"
                />
              </div>

              <div className="bg-primary/10 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                <span className="text-[11px] text-primary">
                  {t("termsTotalEnergy")}
                </span>
                <span className="text-base font-extrabold text-primary">
                  {num(computedCalories)} {t("termsCalUnit")}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {num(computedCarbs)} {t("termsCarbsSuffix")}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href={`/${locale}/food-analysis/personal`}
              className="text-xs text-on-surface-variant hover:text-primary font-medium"
            >
              {t("termsBackEdit")}
            </Link>

            <Link
              href={`/${locale}/nutrition/diary`}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Utensils size={18} aria-hidden="true" />
              <span>
                {t("termsOpenDiary")}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
