import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { getPhysiology } from "@/contexts/nutrition/queries";
import { savePhysiology } from "@/contexts/nutrition/actions";
import { activityFactors } from "@/contexts/nutrition/kernel";
import {
  formatPersianNumber,
  toPersianDigits,
  calculateBmi,
  calculateBmr,
  calculateTdee,
} from "@/lib/metabolism";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";
import {
  Accessibility,
  Dumbbell,
  Flame,
  Footprints,
  LayoutDashboard,
  Mars,
  NotebookPen,
  Rocket,
  Save,
  Trophy,
  Utensils,
  Venus,
  Weight,
  Zap,
  Armchair,
  type LucideIcon,
} from "lucide-react";

const ACTIVITIES: Array<{ level: string; labelKey: string; descKey: string; icon: LucideIcon }> = [
  { level: "sedentary", labelKey: "bodyActSedentaryLabel", descKey: "bodyActSedentaryDesc", icon: Armchair },
  { level: "light", labelKey: "bodyActLightLabel", descKey: "bodyActLightDesc", icon: Footprints },
  { level: "moderate", labelKey: "bodyActModerateLabel", descKey: "bodyActModerateDesc", icon: Dumbbell },
  { level: "active", labelKey: "bodyActActiveLabel", descKey: "bodyActActiveDesc", icon: Rocket },
  { level: "very_active", labelKey: "bodyActVeryActiveLabel", descKey: "bodyActVeryActiveDesc", icon: Trophy },
];

export default async function BodyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireUser();
  const t = await getTranslations("metabolism");
  const profile = await getPhysiology(user.id);

  // Baseline values
  const defaultSex = (profile?.sex as "male" | "female") ?? "male";
  const defaultBirthDate = profile?.birthDate ?? "1992-05-15";
  const defaultHeight = profile?.heightCm ? Number(profile.heightCm) : 175;
  const defaultWeight = profile?.weightKg ? Number(profile.weightKg) : 69;
  const defaultActivity = profile?.activityLevel ?? "moderate";

  const ageYears = profile?.age ?? 32;
  const bmrValue =
    profile?.bmr ??
    calculateBmr({
      gender: defaultSex,
      weightKg: defaultWeight,
      heightCm: defaultHeight,
      ageYears,
    });

  const tdeeValue =
    profile?.tdee ??
    calculateTdee(bmrValue, activityFactors[defaultActivity as keyof typeof activityFactors] ?? 1.55);

  const bmiResult = calculateBmi(defaultWeight, defaultHeight);

  // Goal targets
  const deficitCal = Math.max(1200, tdeeValue - 400);
  const maintainCal = tdeeValue;
  const surplusCal = tdeeValue + 300;

  const formatNum = (n: number, decimals = 0) => {
    if (locale === "en") return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return formatPersianNumber(n, { decimals });
  };

  const bmiLabel =
    bmiResult.bmi < 18.5
      ? t("bmiUnderweight")
      : bmiResult.bmi < 25
        ? t("bmiNormal")
        : bmiResult.bmi < 30
          ? t("bmiOverweight")
          : t("bmiObese");

  const bmiRanges = [t("bodyBmiRange1"), t("bodyBmiRange2"), t("bodyBmiRange3"), t("bodyBmiRange4")];
  const ageLabel = locale === "en" ? String(ageYears) : toPersianDigits(ageYears);

  return (
    <div className="flex flex-col gap-8 text-start" dir={locale === "en" ? "ltr" : "rtl"}>
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          {t("bodyTitle")}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant mt-1">
          {t("bodySubtitle")}
        </p>
      </div>

      {/* Main Grid: Input Form (5 cols) & Results (7 cols) (Screen #41) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/20">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Accessibility size={24} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">{t("bodyFormTitle")}</h2>
              <p className="text-xs text-on-surface-variant">{t("bodyFormSubtitle")}</p>
            </div>
          </div>

          <form
            action={async (formData) => {
              "use server";
              await savePhysiology(formData);
            }}
            className="flex flex-col gap-5"
          >
            {/* Biological Sex Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-on-surface">
                {t("bodySexLabel")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value="male"
                    defaultChecked={defaultSex === "male"}
                    className="peer sr-only"
                  />
                  <div className="p-3 rounded-xl bg-surface-container-low text-on-surface peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center gap-2 transition-all font-bold text-sm">
                    <Mars size={20} aria-hidden="true" />
                    <span>{t("male")}</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="sex"
                    value="female"
                    defaultChecked={defaultSex === "female"}
                    className="peer sr-only"
                  />
                  <div className="p-3 rounded-xl bg-surface-container-low text-on-surface peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-center gap-2 transition-all font-bold text-sm">
                    <Venus size={20} aria-hidden="true" />
                    <span>{t("female")}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Birth Date */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="birthDate"
                  className="text-xs sm:text-sm font-bold text-on-surface"
                >
                  {t("bodyBirthDate")}
                </label>
                <span className="text-[11px] text-primary font-semibold">
                  {t("bodyEstAge", { age: ageLabel })}
                </span>
              </div>
              <JalaliDatePicker
                locale={locale}
                name="birthDate"
                id="birthDate"
                defaultValue={defaultBirthDate}
                max={new Date().toISOString().slice(0, 10)}
                required
              />
            </div>

            {/* Height & Weight Dual Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="heightCm"
                  className="text-xs sm:text-sm font-bold text-on-surface"
                >
                  {t("bodyHeightLabel")}
                </label>
                <input
                  id="heightCm"
                  name="heightCm"
                  type="number"
                  min={80}
                  max={250}
                  defaultValue={defaultHeight}
                  required
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="weightKg"
                  className="text-xs sm:text-sm font-bold text-on-surface"
                >
                  {t("bodyWeightLabel")}
                </label>
                <input
                  id="weightKg"
                  name="weightKg"
                  type="number"
                  step="0.5"
                  min={25}
                  max={300}
                  defaultValue={defaultWeight}
                  required
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
                />
              </div>
            </div>

            {/* Physical Activity Level */}
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-bold text-on-surface">
                {t("bodyActivityLabel")}
              </label>

              <div className="flex flex-col gap-2">
                {ACTIVITIES.map((act) => (
                  <label key={act.level} className="cursor-pointer">
                    <input
                      type="radio"
                      name="activityLevel"
                      value={act.level}
                      defaultChecked={defaultActivity === act.level}
                      className="peer sr-only"
                    />
                    <div className="p-3 rounded-xl bg-surface-container-low text-on-surface peer-checked:bg-primary peer-checked:text-on-primary flex items-center justify-between transition-all">
                      <div className="flex items-center gap-2.5">
                        <act.icon size={20} aria-hidden="true" />
                        <div className="flex flex-col">
                          <span className="font-bold text-xs sm:text-sm">{t(act.labelKey)}</span>
                          <span className="text-[11px] opacity-80">{t(act.descKey)}</span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 mt-2"
            >
              <Save size={20} aria-hidden="true" />
              <span>{t("bodySubmitCta")}</span>
            </button>
          </form>
        </div>

        {/* Results & Metabolic Insights (7 cols) (Screen #41) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Dual Cards: BMR & TDEE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* BMR Card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-on-surface">
                    {t("bodyBmrTitle")}
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-primary font-data-metric">
                      {formatNum(bmrValue)}
                    </span>
                    <span className="text-xs text-on-surface-variant">{t("bodyKcalPerDay")}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Zap size={26} aria-hidden="true" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {t("bodyBmrDesc")}
              </p>
            </div>

            {/* TDEE Card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-secondary">
                    {t("bodyTdeeTitle")}
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-secondary font-data-metric">
                      {formatNum(tdeeValue)}
                    </span>
                    <span className="text-xs text-on-surface-variant">{t("bodyKcalPerDay")}</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <Flame size={26} aria-hidden="true" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {t("bodyTdeeDesc")}
              </p>
            </div>
          </div>

          {/* BMI Card with Visual Bar */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Weight size={22} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-on-surface">
                    {t("bodyBmiTitle")}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {t("bodyBmiDesc")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-primary/10 px-3.5 py-1 rounded-full text-primary font-bold text-sm">
                <span>{t("bodyIndexPrefix")}</span>
                <span>{formatNum(bmiResult.bmi, 1)}</span>
                <span className="text-xs font-normal">({bmiLabel})</span>
              </div>
            </div>

            {/* Segmented Color Bar */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex">
                <div className="h-full bg-blue-300 w-[18.5%]" title={bmiRanges[0]} />
                <div className="h-full bg-primary w-[31%]" title={bmiRanges[1]} />
                <div className="h-full bg-secondary-container w-[25%]" title={bmiRanges[2]} />
                <div className="h-full bg-error w-[25.5%]" title={bmiRanges[3]} />
              </div>
              <div className="grid grid-cols-4 text-center text-[11px] text-on-surface-variant pt-1">
                <div>{bmiRanges[0]}</div>
                <div className="text-primary font-bold">{bmiRanges[1]}</div>
                <div>{bmiRanges[2]}</div>
                <div>{bmiRanges[3]}</div>
              </div>
            </div>
          </div>

          {/* Daily Calorie Targets by Goal */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-bold text-base sm:text-lg text-on-surface">
              {t("bodyGoalsTitle")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Deficit */}
              <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col justify-between border border-outline-variant/20">
                <span className="font-bold text-xs sm:text-sm text-on-surface">
                  {t("bodyDeficitTitle")}
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  {t("bodyDeficitDesc")}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-extrabold text-xl text-on-surface font-data-metric">
                    {formatNum(deficitCal)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{t("bodyCalUnit")}</span>
                </div>
              </div>

              {/* Maintenance */}
              <div className="bg-primary/10 p-4 rounded-2xl flex flex-col justify-between border border-primary/20">
                <span className="font-bold text-xs sm:text-sm text-primary">{t("bodyMaintainTitle")}</span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  {t("bodyMaintainDesc")}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-extrabold text-xl text-primary font-data-metric">
                    {formatNum(maintainCal)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{t("bodyCalUnit")}</span>
                </div>
              </div>

              {/* Surplus */}
              <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col justify-between border border-outline-variant/20">
                <span className="font-bold text-xs sm:text-sm text-on-surface">
                  {t("bodySurplusTitle")}
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  {t("bodySurplusDesc")}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-extrabold text-xl text-on-surface font-data-metric">
                    {formatNum(surplusCal)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">{t("bodyCalUnit")}</span>
                </div>
              </div>
            </div>

            {/* Smooth Next Steps Connections */}
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs text-on-surface-variant font-medium">
                {t("bodyNextSteps")}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/${locale}/nutrition/diary`}
                  className="bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <Utensils size={16} aria-hidden="true" />
                  <span>{t("bodyStep1")}</span>
                </Link>
                <Link
                  href={`/${locale}/nutrition/diet`}
                  className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-outline-variant/30 flex items-center gap-1.5"
                >
                  <NotebookPen size={16} aria-hidden="true" />
                  <span>{t("bodyStep2")}</span>
                </Link>
                <Link
                  href={`/${locale}/nutrition`}
                  className="bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-outline-variant/30 flex items-center gap-1.5"
                >
                  <LayoutDashboard size={16} aria-hidden="true" />
                  <span>{t("bodyStep3")}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
