"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Calculator, Mars, Utensils, Venus } from "lucide-react";
import {
  calculateBmr,
  calculateTdee,
  calculateBmi,
  formatPersianNumber,
} from "@/lib/metabolism";

export interface ActivityOption {
  value: number;
  label: string;
}

// Activity multiplier values are locale-independent; labels resolve
// from the "metabolism" message catalog (activity1..activity4).
const ACTIVITY_VALUES = [1.2, 1.375, 1.55, 1.725];

export interface MetabolismCalculatorProps {
  locale?: string;
  className?: string;
  initialGender?: "male" | "female";
  initialAge?: number;
  initialHeight?: number;
  initialWeight?: number;
  initialActivity?: number;
  diaryHref?: string;
}

export function MetabolismCalculator({
  locale = "fa",
  className = "",
  initialGender = "male",
  initialAge = 32,
  initialHeight = 175,
  initialWeight = 69,
  initialActivity = 1.375,
  diaryHref,
}: MetabolismCalculatorProps) {
  const [gender, setGender] = useState<"male" | "female">(initialGender);
  const [age, setAge] = useState<number>(initialAge);
  const [height, setHeight] = useState<number>(initialHeight);
  const [weight, setWeight] = useState<number>(initialWeight);
  const [activity, setActivity] = useState<number>(initialActivity);

  const t = useTranslations("metabolism");
  const isEn = locale === "en";

  const strings = {
    sectionAria: t("sectionAria"),
    widgetBadge: t("badge"),
    headline: t("headline"),
    description: t("description"),
    genderLabel: t("genderLabel"),
    male: t("male"),
    female: t("female"),
    ageLabel: t("ageLabel"),
    heightLabel: t("heightLabel"),
    weightLabel: t("weightLabel"),
    activityLabel: t("activityLabel"),
    resultsTitle: t("resultsTitle"),
    validationBadge: t("validationBadge"),
    bmrTitle: t("bmrTitle"),
    bmrSubtext: t("bmrSubtext"),
    tdeeTitle: t("tdeeTitle"),
    tdeeSubtext: t("tdeeSubtext"),
    bmiTitle: t("bmiTitle"),
    ctaDiary: t("ctaDiary"),
    bmiCategories: {
      underweight: t("bmiUnderweight"),
      normal: t("bmiNormal"),
      overweight: t("bmiOverweight"),
      obese: t("bmiObese"),
      unknown: t("bmiUnknown"),
    },
  };
  const activityOptions: ActivityOption[] = ACTIVITY_VALUES.map((value, idx) => ({
    value,
    label: t(`activity${idx + 1}`),
  }));

  const bmr = useMemo(
    () => calculateBmr({ gender, weightKg: weight, heightCm: height, ageYears: age }),
    [gender, weight, height, age]
  );

  const tdee = useMemo(
    () => calculateTdee(bmr, activity),
    [bmr, activity]
  );

  const bmiResult = useMemo(
    () => calculateBmi(weight, height),
    [weight, height]
  );

  const localizedBmiLabel = useMemo(() => {
    const val = bmiResult.bmi;
    if (val <= 0) return strings.bmiCategories.unknown;
    if (val < 18.5) return strings.bmiCategories.underweight;
    if (val < 25) return strings.bmiCategories.normal;
    if (val < 30) return strings.bmiCategories.overweight;
    return strings.bmiCategories.obese;
  }, [bmiResult.bmi, strings]);

  const targetDiaryHref = diaryHref ?? `/${locale}/nutrition/calorie`;

  const formatNumber = (num: number, decimals = 0) => {
    if (locale === "fa") {
      return formatPersianNumber(num, { decimals });
    }
    return decimals > 0 ? num.toFixed(decimals) : String(Math.round(num));
  };

  return (
    <section
      id="metabolism-widget"
      dir={isEn ? "ltr" : "rtl"}
      aria-label={strings.sectionAria}
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full ${className}`}
    >
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg relative overflow-hidden border border-outline-variant/30">
        <div className="absolute -bottom-20 -start-20 w-80 h-80 bg-primary/5 rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Column 1: Inputs Form */}
          <div className="lg:col-span-7 text-start flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full mb-3">
                <Calculator size={18} className="text-secondary" aria-hidden="true" />
                <span className="font-bold text-xs sm:text-sm text-secondary">
                  {strings.widgetBadge}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-2 tracking-tight">
                {strings.headline}
              </h2>

              <p className="text-sm sm:text-base text-on-surface-variant mb-6 leading-relaxed">
                {strings.description}
              </p>

              <form
                id="calc-form"
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4 sm:space-y-5"
              >
                {/* Gender Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-2">
                    {strings.genderLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        gender === "male"
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-transparent hover:bg-surface-container"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={gender === "male"}
                        onChange={() => setGender("male")}
                        className="sr-only"
                      />
                      <Mars size={18} aria-hidden="true" />
                      <span className="text-xs sm:text-sm font-bold">{strings.male}</span>
                    </label>

                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        gender === "female"
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-transparent hover:bg-surface-container"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={gender === "female"}
                        onChange={() => setGender("female")}
                        className="sr-only"
                      />
                      <Venus size={18} aria-hidden="true" />
                      <span className="text-xs sm:text-sm font-bold">{strings.female}</span>
                    </label>
                  </div>
                </div>

                {/* Age, Height, Weight Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="calc-age"
                      className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                    >
                      {strings.ageLabel}
                    </label>
                    <input
                      id="calc-age"
                      type="number"
                      min={12}
                      max={99}
                      value={age || ""}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="calc-height"
                      className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                    >
                      {strings.heightLabel}
                    </label>
                    <input
                      id="calc-height"
                      type="number"
                      min={100}
                      max={220}
                      value={height || ""}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="calc-weight"
                      className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                    >
                      {strings.weightLabel}
                    </label>
                    <input
                      id="calc-weight"
                      type="number"
                      min={30}
                      max={200}
                      value={weight || ""}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30"
                    />
                  </div>
                </div>

                {/* Activity Multiplier */}
                <div>
                  <label
                    htmlFor="calc-activity"
                    className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                  >
                    {strings.activityLabel}
                  </label>
                  <select
                    id="calc-activity"
                    value={activity}
                    onChange={(e) => setActivity(Number(e.target.value))}
                    className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30 cursor-pointer"
                  >
                    {activityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
          </div>

          {/* Column 2: Interactive Live Results Display */}
          <div className="lg:col-span-5 bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between text-start relative">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg sm:text-xl font-extrabold text-on-primary">
                  {strings.resultsTitle}
                </span>
                <span className="bg-surface-container-lowest/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-on-primary">
                  {strings.validationBadge}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {/* BMR Box */}
                <div className="bg-surface-container-lowest/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                  <div className="text-xs sm:text-sm text-on-primary/80 font-medium">
                    {strings.bmrTitle}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      id="bmr-output"
                      className="text-2xl sm:text-3xl font-extrabold text-on-primary tracking-tight"
                    >
                      {formatNumber(bmr)}
                    </span>
                    <span className="text-xs text-on-primary/80">
                      {strings.bmrSubtext}
                    </span>
                  </div>
                </div>

                {/* TDEE Box */}
                <div className="bg-surface-container-lowest/15 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                  <div className="text-xs sm:text-sm text-secondary-fixed font-bold">
                    {strings.tdeeTitle}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      id="tdee-output"
                      className="text-2xl sm:text-3xl font-extrabold text-secondary-fixed tracking-tight"
                    >
                      {formatNumber(tdee)}
                    </span>
                    <span className="text-xs text-on-primary/80">
                      {strings.tdeeSubtext}
                    </span>
                  </div>
                </div>

                {/* BMI Box */}
                <div className="bg-surface-container-lowest/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                  <div className="text-xs sm:text-sm text-on-primary/80 font-medium">
                    {strings.bmiTitle}
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        id="bmi-output"
                        className="text-2xl sm:text-3xl font-extrabold text-on-primary tracking-tight"
                      >
                        {formatNumber(bmiResult.bmi, 1)}
                      </span>
                      <span
                        id="bmi-label"
                        className="text-xs font-bold text-on-primary bg-surface-container-lowest/20 px-2.5 py-0.5 rounded-full"
                      >
                        {localizedBmiLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct CTA link to Iranian food diary */}
            <Link
              href={targetDiaryHref}
              className="w-full bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-center font-bold text-sm sm:text-base shadow-md hover:shadow-lg mt-4 cursor-pointer"
            >
              <Utensils size={20} className="shrink-0" aria-hidden="true" />
              <span>{strings.ctaDiary}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
