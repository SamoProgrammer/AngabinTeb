"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Salad,
  TrendingDown,
  TrendingUp,
  User,
  UserRound,
  type LucideIcon,
} from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "1.2", labelKey: "personalActSedentary" },
  { value: "1.375", labelKey: "personalActLight" },
  { value: "1.55", labelKey: "personalActModerate" },
  { value: "1.725", labelKey: "personalActHeavy" },
  { value: "1.9", labelKey: "personalActAthlete" },
] as const;

const GOALS: Array<{ id: string; labelKey: string; icon: LucideIcon }> = [
  { id: "loss", labelKey: "personalGoalLoss", icon: TrendingDown },
  { id: "maintain", labelKey: "personalGoalMaintain", icon: Salad },
  { id: "gain", labelKey: "personalGoalGain", icon: TrendingUp },
  { id: "diabetes", labelKey: "personalGoalDiabetes", icon: Activity },
];

export default function PersonalBiometricsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const t = useTranslations("metabolism");
  const dir = locale === "en" ? "ltr" : "rtl";
  const digit1 = locale === "en" ? "1" : locale === "ar" ? "١" : "۱";
  const digit2 = locale === "en" ? "2" : locale === "ar" ? "٢" : "۲";
  const SubmitIcon = locale === "en" ? ArrowRight : ArrowLeft;

  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("175");
  const [weightKg, setWeightKg] = useState("78");
  const [activityLevel, setActivityLevel] = useState("1.375"); // Lightly active
  const [goal, setGoal] = useState<"loss" | "maintain" | "gain" | "diabetes">("loss");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = new URLSearchParams({
      gender,
      age,
      height: heightCm,
      weight: weightKg,
      activity: activityLevel,
      goal,
    });
    router.push(`/${locale}/food-analysis/terms?${query.toString()}`);
  }

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("personalHome")}
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/nutrition`} className="hover:text-primary transition-colors">
            {t("personalNutrition")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("personalCrumb")}
          </span>
        </div>

        {/* Funnel Progress Indicator */}
        <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
              {digit1}
            </div>
            <div className="flex flex-col text-start">
              <span className="text-xs sm:text-sm font-bold text-on-surface">
                {t("personalStep1Title")}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {t("personalFunnelStep")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant/40">
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center font-bold text-xs">
              {digit2}
            </div>
            <span className="text-xs hidden sm:inline">
              {t("personalStep2Label")}
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-tier-2 border border-outline-variant/30">
          <div className="mb-6 text-start">
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
              {t("personalFormTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              {t("personalFormDesc")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Gender Picker */}
            <div className="flex flex-col gap-2 text-start">
              <label className="text-xs font-bold text-on-surface">
                {t("personalGender")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    gender === "male"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-outline-variant/30 bg-surface-container-low text-on-surface"
                  }`}
                >
                  <User size={20} aria-hidden="true" />
                  <span>{t("personalMale")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    gender === "female"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-outline-variant/30 bg-surface-container-low text-on-surface"
                  }`}
                >
                  <UserRound size={20} aria-hidden="true" />
                  <span>{t("personalFemale")}</span>
                </button>
              </div>
            </div>

            {/* Age, Height, Weight Triplet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-start">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">
                  {t("personalAge")}
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-sm py-2.5 px-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">
                  {t("personalHeight")}
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  max="250"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-sm py-2.5 px-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">
                  {t("personalWeight")}
                </label>
                <input
                  type="number"
                  required
                  min="30"
                  max="300"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface text-sm py-2.5 px-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div className="flex flex-col gap-2 text-start">
              <label className="text-xs font-bold text-on-surface">
                {t("personalActivity")}
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface text-xs sm:text-sm py-3 px-3 rounded-xl border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Goal */}
            <div className="flex flex-col gap-2 text-start">
              <label className="text-xs font-bold text-on-surface">
                {t("personalGoal")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGoal(g.id as typeof goal)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs transition-all ${
                      goal === g.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <g.icon size={20} className="mb-1" aria-hidden="true" />
                    <span className="text-center">{t(g.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 flex items-center justify-between gap-4">
              <Link
                href={`/${locale}/nutrition`}
                className="text-xs text-on-surface-variant hover:text-primary font-medium"
              >
                {t("personalCancel")}
              </Link>
              <button
                type="submit"
                className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs sm:text-sm py-3 px-8 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span>
                  {t("personalContinue")}
                </span>
                <SubmitIcon size={18} aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
