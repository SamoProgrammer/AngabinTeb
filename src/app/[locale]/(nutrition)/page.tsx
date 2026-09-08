import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { getPhysiology, dayIntake, listPrograms } from "@/contexts/nutrition/queries";
import {
  formatPersianNumber,
  toPersianDigits,
  calculateBmi,
  calculateMacros,
} from "@/lib/metabolism";
import { formatJalaliTime } from "@/lib/format";
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Droplet,
  Flag,
  Flower2,
  Gauge,
  NotebookPen,
  Pencil,
  Plus,
  ReceiptText,
  Ruler,
  Scale,
  Utensils,
  Zap,
} from "lucide-react";

export default async function NutritionHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const t = await getTranslations("nutrition");
  const tm = await getTranslations("metabolism");
  const today = new Date().toISOString().slice(0, 10);
  const [profile, intakeData, featuredPrograms] = await Promise.all([
    getPhysiology(user.id),
    dayIntake(user.id, today),
    listPrograms("clinics", locale),
  ]);

  // Anthropometrics
  const hasProfile = Boolean(profile?.weightKg);
  const currentWeight = profile?.weightKg ? Number(profile.weightKg) : 69.0;
  const targetWeight = currentWeight > 65 ? currentWeight - 6 : 63.0;
  const heightCm = profile?.heightCm ? Number(profile.heightCm) : 175;
  const bmiInfo = calculateBmi(currentWeight, heightCm);

  // Calorie & Macro calculations
  const bmr = profile?.bmr ?? 1420;
  const tdee = profile?.tdee ?? 1850;
  const hasIntake = Boolean(intakeData?.totals && (intakeData.totals["n-energy"] ?? 0) > 0);
  const consumedKcal = hasIntake
    ? Math.round(intakeData.totals["n-energy"] ?? 0)
    : 0;
  const remainingKcal = Math.max(0, tdee - consumedKcal);
  const caloriePercent = Math.min(100, Math.round((consumedKcal / tdee) * 100));

  const macroTargets = calculateMacros(tdee);
  const consumedCarbs = hasIntake
    ? Math.round(intakeData.totals["n-carbs"] ?? 0)
    : 0;
  const consumedProtein = hasIntake
    ? Math.round(intakeData.totals["n-protein"] ?? 0)
    : 0;
  const consumedFat = hasIntake
    ? Math.round(intakeData.totals["n-fat"] ?? 0)
    : 0;

  const carbTarget = macroTargets.carbGrams || 230;
  const proteinTarget = macroTargets.proteinGrams || 110;
  const fatTarget = macroTargets.fatGrams || 55;

  const carbsPct = Math.min(100, Math.round((consumedCarbs / carbTarget) * 100));
  const proteinPct = Math.min(100, Math.round((consumedProtein / proteinTarget) * 100));
  const fatPct = Math.min(100, Math.round((consumedFat / fatTarget) * 100));

  // Circular gauge progress (0-100, rendered as a conic-gradient ring)
  const calorieSweep = Math.min(100, Math.max(0, caloriePercent));
  const isRtl = locale !== "en";
  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;
  const ChevronIcon = locale === "en" ? ChevronRight : ChevronLeft;

  const formatNum = (n: number, decimals = 0) => {
    if (locale === "en") return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return formatPersianNumber(n, { decimals });
  };
  const formatDigits = (val: string | number) => {
    if (locale === "en") return String(val);
    return toPersianDigits(val);
  };

  const bmiLabel =
    bmiInfo.bmi < 18.5
      ? tm("bmiUnderweight")
      : bmiInfo.bmi < 25
        ? tm("bmiNormal")
        : bmiInfo.bmi < 30
          ? tm("bmiOverweight")
          : tm("bmiObese");

  const planDays = (d: number) => t("dashPlanDays", { d: locale === "en" ? String(d) : toPersianDigits(d) });

  return (
    <div className="flex flex-col gap-8 text-start" dir={isRtl ? "rtl" : "ltr"}>
      {/* 1. Header & Anthropometric Metric Bar (Screen #14) */}
      <section aria-label={t("dashAnthroAria")}>
        <div className="flex flex-col mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {t("dashPageTitle")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1">
            {t("dashPageSubtitle")}
          </p>
        </div>

        {/* Onboarding Notice for users without a saved profile */}
        {!hasProfile && (
          <div className="mb-6 bg-gradient-to-r from-secondary/15 via-surface-container-low to-primary/15 border border-secondary/30 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-xs">
                <Accessibility size={26} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-on-surface">
                  {t("dashNoProfileTitle")}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                  {t("dashNoProfileDesc")}
                </p>
              </div>
            </div>
            <Link
              href={`/${locale}/nutrition/body`}
              className="bg-secondary hover:bg-secondary/90 text-on-secondary text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all shrink-0 flex items-center gap-1.5"
            >
              <Pencil size={18} aria-hidden="true" />
              <span>{t("dashNoProfileCta")}</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Current Weight */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                  {t("dashCurrentWeight")}
                </span>
                {!hasProfile && (
                  <span className="text-[10px] text-secondary font-bold bg-secondary/10 px-1.5 py-0.2 rounded">
                    {t("dashSampleBadge")}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-primary font-data-metric">
                  {formatNum(currentWeight, 1)}
                </span>
                <span className="text-xs text-on-surface-variant">{t("dashKgUnit")}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Scale size={26} aria-hidden="true" />
            </div>
          </div>

          {/* Card 2: Target Weight */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                {t("dashTargetWeight")}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-secondary font-data-metric">
                  {formatNum(targetWeight, 1)}
                </span>
                <span className="text-xs text-on-surface-variant">{t("dashKgUnit")}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <Flag size={26} aria-hidden="true" />
            </div>
          </div>

          {/* Card 3: Height */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                {t("dashRecordedHeight")}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-on-surface font-data-metric">
                  {formatDigits(heightCm)}
                </span>
                <span className="text-xs text-on-surface-variant">{t("dashCmUnit")}</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface shrink-0">
              <Ruler size={26} aria-hidden="true" />
            </div>
          </div>

          {/* Card 4: BMI */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                {t("dashBmiTitle")}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-primary font-data-metric">
                  {formatNum(bmiInfo.bmi, 1)}
                </span>
                <span className="text-xs font-bold text-primary">
                  ({bmiLabel})
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Gauge size={26} aria-hidden="true" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Today's Intake & Macro Balance Interactive Widget (Screen #14) */}
      <section
        aria-label={t("dashMacroAria")}
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ChartPie size={24} className="text-primary" aria-hidden="true" />
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                {t("dashMacroTitle")}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              {t("dashMacroSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-surface-container-high rounded-xl text-on-surface-variant text-xs sm:text-sm font-semibold">
              {t("dashBmrRange")} {formatNum(bmr)} Kcal
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-xl text-xs sm:text-sm">
              {t("dashTotalTarget")} {formatNum(tdee)} Kcal
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Circular / Radial Calorie Visualization Gauge */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-surface-container-low/60 rounded-3xl p-6 border border-outline-variant/20">
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
              <div
                className="w-full h-full rounded-full"
                role="progressbar"
                aria-valuenow={calorieSweep}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                  background: `conic-gradient(var(--color-primary) ${calorieSweep}%, var(--color-surface-container-high) ${calorieSweep}%)`,
                  WebkitMask:
                    "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))",
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <span className="text-xs text-on-surface-variant font-medium">
                  {t("dashConsumedCal")}
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-primary my-1 font-data-metric">
                  {formatNum(consumedKcal)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-secondary">
                  {formatNum(remainingKcal)} {t("dashRemainingToCap")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-4 text-center">
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                <span className="text-xs text-on-surface-variant block">{t("dashDailyAllowance")}</span>
                <p className="text-base sm:text-lg font-bold text-on-surface mt-0.5">
                  {formatNum(tdee)} <span className="text-xs font-normal">{t("dashCalUnit")}</span>
                </p>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                <span className="text-xs text-on-surface-variant block">{t("dashRemainingAllowance")}</span>
                <p className="text-base sm:text-lg font-bold text-secondary mt-0.5">
                  {formatNum(remainingKcal)} <span className="text-xs font-normal">{t("dashCalUnit")}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Macro Details & Detailed Bars */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Carbohydrates */}
            <div className="bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-secondary" />
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {t("dashCarbsTitle")}
                  </span>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    {t("dashCarbsExamples")}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-on-surface">
                  <span className="font-bold text-sm sm:text-base">
                    {formatDigits(consumedCarbs)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    / {formatDigits(carbTarget)} {t("dashGramUnit")} ({formatDigits(carbsPct)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full transition-all duration-700"
                  style={{ width: `${carbsPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-on-surface-variant">
                <span>
                  {formatDigits(Math.max(0, carbTarget - consumedCarbs))} {t("dashCarbsRemainingHint")}
                </span>
                <span className="text-secondary font-bold">{t("dashCarbsStatus")}</span>
              </div>
            </div>

            {/* Proteins */}
            <div className="bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {t("dashProteinTitle")}
                  </span>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    {t("dashProteinExamples")}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-on-surface">
                  <span className="font-bold text-sm sm:text-base">
                    {formatDigits(consumedProtein)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    / {formatDigits(proteinTarget)} {t("dashGramUnit")} ({formatDigits(proteinPct)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-700"
                  style={{ width: `${proteinPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-on-surface-variant">
                <span>
                  {formatDigits(Math.max(0, proteinTarget - consumedProtein))} {t("dashProteinRemainingHint")}
                </span>
                <span className="text-primary font-bold">{t("dashProteinStatus")}</span>
              </div>
            </div>

            {/* Healthy Fats */}
            <div className="bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary" />
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {t("dashFatTitle")}
                  </span>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    {t("dashFatExamples")}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-on-surface">
                  <span className="font-bold text-sm sm:text-base">
                    {formatDigits(consumedFat)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    / {formatDigits(fatTarget)} {t("dashGramUnit")} ({formatDigits(fatPct)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                <div
                  className="bg-tertiary h-full rounded-full transition-all duration-700"
                  style={{ width: `${fatPct}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-on-surface-variant">
                <span>
                  {formatDigits(Math.max(0, fatTarget - consumedFat))} {t("dashFatRemainingHint")}
                </span>
                <span className="text-tertiary font-bold">{t("dashFatStatus")}</span>
              </div>
            </div>

            {/* Hydration Indicator */}
            <div className="flex items-center justify-between bg-surface-container p-3 sm:p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <Droplet size={20} className="text-primary" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-semibold text-on-surface">
                  {t("dashHydrationTitle")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-primary">
                  {t("dashHydrationValue")}
                </span>
              </div>
              <span className="text-xs text-on-surface-variant bg-surface-container-lowest px-2.5 py-1 rounded-lg">
                {t("dashHydrationTag")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Key Operational Action Shortcuts (Bento Grid) (Screen #14) */}
      <section aria-label={t("dashShortcutsAria")}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={22} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold text-on-surface">
              {t("dashShortcutsTitle")}
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant">
            {t("dashShortcutsSubtitle")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Meal Log */}
          <Link
            href={`/${locale}/nutrition/diary`}
            className="group bg-surface-container-lowest hover:bg-surface-bright rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Utensils size={24} aria-hidden="true" />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                <ArrowIcon size={18} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                {t("dashAction1Title")}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {t("dashAction1Desc")}
              </p>
            </div>
            <div className="mt-4 pt-2 text-primary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>{t("dashAction1Cta")}</span>
              <ChevronIcon size={16} aria-hidden="true" />
            </div>
          </Link>

          {/* Action 2: Recalculate BMR/TDEE */}
          <Link
            href={`/${locale}/nutrition/body`}
            className="group bg-surface-container-lowest hover:bg-surface-bright rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Calculator size={24} aria-hidden="true" />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-tertiary transition-colors">
                <ArrowIcon size={18} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-tertiary transition-colors">
                {t("dashAction2Title")}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {t("dashAction2Desc")}
              </p>
            </div>
            <div className="mt-4 pt-2 text-tertiary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>{t("dashAction2Cta")}</span>
              <ChevronIcon size={16} aria-hidden="true" />
            </div>
          </Link>

          {/* Action 3: Persian Food Database */}
          <Link
            href={`/${locale}/nutrition/foods`}
            className="group bg-surface-container-lowest hover:bg-surface-bright rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <BookOpen size={24} aria-hidden="true" />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-secondary transition-colors">
                <ArrowIcon size={18} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-secondary transition-colors">
                {t("dashAction3Title")}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {t("dashAction3Desc")}
              </p>
            </div>
            <div className="mt-4 pt-2 text-secondary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>{t("dashAction3Cta")}</span>
              <ChevronIcon size={16} aria-hidden="true" />
            </div>
          </Link>

          {/* Action 4: Clinical Dietitian Consultation */}
          <Link
            href={`/${locale}/nutrition/diet`}
            className="group bg-surface-container-lowest hover:bg-surface-bright rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <NotebookPen size={24} aria-hidden="true" />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                <ArrowIcon size={18} aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                {t("dashAction4Title")}
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                {t("dashAction4Desc")}
              </p>
            </div>
            <div className="mt-4 pt-2 text-primary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>{t("dashAction4Cta")}</span>
              <ChevronIcon size={16} aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Today's Logged Meals Summary (Screen #14) */}
      <section aria-label={t("dashLoggedMealsAria")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ReceiptText size={22} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold text-on-surface">
              {t("dashLoggedMealsTitle")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-on-surface-variant">
              {t("dashTotalConsumedEnergy")}
            </span>
            <span className="text-sm sm:text-base font-bold text-primary">
              {formatNum(consumedKcal)} Kcal
            </span>
          </div>
        </div>

        {!intakeData?.intakes || intakeData.intakes.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-xs border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Utensils size={30} aria-hidden="true" />
            </div>
            <div className="max-w-md">
              <p className="text-sm sm:text-base text-on-surface font-medium leading-relaxed">
                {t("dashEmptyDiaryMsg")}
              </p>
            </div>
            <Link
              href={`/${locale}/nutrition/diary`}
              className="bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus size={18} aria-hidden="true" />
              <span>{t("dashEmptyDiaryCta")}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {intakeData.intakes.map((intake) => (
              <div
                key={intake.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pt-1 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Utensils size={20} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-on-surface">{intake.foodName}</h3>
                        <span className="text-[11px] text-on-surface-variant">
                          {formatJalaliTime(intake.loggedAt, locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">{t("dashIntakeQuantity")}</span>
                    <span className="font-bold text-on-surface">
                      {formatDigits(intake.quantity)} {intake.servingUnitName}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between border-t border-outline-variant/20 text-xs">
                  <span className="text-primary font-medium flex items-center gap-1">
                    <CircleCheckBig size={14} aria-hidden="true" />
                    <span>{t("dashIntakeLoggedStatus")}</span>
                  </span>
                </div>
              </div>
            ))}
            {/* Quick add more card */}
            <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-dashed border-primary/40 flex flex-col justify-between items-center text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center my-2 shadow-2xs">
                <Plus size={24} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-on-surface">{t("dashQuickAddTitle")}</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {t("dashQuickAddCap")} {formatDigits(remainingKcal)} Kcal
                </p>
              </div>
              <Link
                href={`/${locale}/nutrition/diary`}
                className="mt-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <Plus size={16} aria-hidden="true" />
                <span>{t("dashQuickAddCta")}</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5. Featured Clinical Diet Plans Preview (Screen #14 & #16) */}
      <section aria-label={t("dashFeaturedAria")}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flower2 size={22} className="text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold text-on-surface">
              {t("dashFeaturedPlansTitle")}
            </h2>
          </div>
          <Link
            href={`/${locale}/nutrition/diet`}
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
          >
            <span>{t("dashViewAllPlans")}</span>
            <ChevronIcon size={18} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredPrograms.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {p.planType}
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">{planDays(p.durationDays)}</span>
                </div>
                <h3 className="font-bold text-base text-on-surface">
                  {p.name}
                </h3>
                {p.description && (
                  <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                    {p.description}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">
                  {Number(p.price) > 0
                    ? `${formatNum(Number(p.price))} ${t("dietCurrency")}`
                    : t("dietFree")}
                </span>
                <Link
                  href={`/${locale}/nutrition/diet/${p.id}`}
                  className="text-primary font-bold text-xs hover:underline"
                >
                  {t("dashReviewPlan")}
                </Link>
              </div>
            </div>
          ))}

          {featuredPrograms.length === 0 && (
            <div className="col-span-full bg-surface-container-lowest rounded-2xl p-6 text-center border border-dashed border-outline-variant/40">
              <p className="text-xs text-on-surface-variant">
                {t("dashFeaturedEmpty")}
              </p>
              <Link
                href={`/${locale}/nutrition/diet`}
                className="text-primary font-bold text-xs hover:underline"
              >
                {t("dashViewAllPlans")}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}