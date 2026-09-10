import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { getPhysiology, weightHistory } from "@/contexts/nutrition/queries";
import { logWeight, savePhysiology } from "@/contexts/nutrition/actions";
import { formatJalaliDate, formatPersianNumber, toPersianDigits } from "@/lib/format";
import { calculateBmi } from "@/lib/metabolism";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";
import {
  Accessibility,
  Armchair,
  ClipboardList,
  Dumbbell,
  Footprints,
  Mars,
  Rocket,
  Save,
  Scale,
  Trophy,
  Venus,
  Weight,
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const user = await requireUser();
  const t = await getTranslations("metabolism");
  const profile = await getPhysiology(user.id);
  const history = await weightHistory(user.id);

  // Baseline values
  const defaultSex = (profile?.sex as "male" | "female") ?? "male";
  const defaultBirthDate = profile?.birthDate ?? "1992-05-15";
  const defaultHeight = profile?.heightCm ? Number(profile.heightCm) : 175;
  const defaultWeight = profile?.weightKg ? Number(profile.weightKg) : 69;
  const defaultActivity = profile?.activityLevel ?? "moderate";

  const ageYears = profile?.age ?? 32;
  const hasProfile = Boolean(profile?.weightKg);
  const bmiResult = calculateBmi(defaultWeight, defaultHeight);

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

  async function logWeightAction(formData: FormData) {
    "use server";
    const res = await logWeight({
      weightKg: Number(formData.get("weightKg")),
      loggedAt: String(formData.get("loggedAt") ?? ""),
    });
    if (!res.ok) {
      redirect(`/${locale}/profile/body?error=${encodeURIComponent(res.error)}`);
    }
    redirect(`/${locale}/profile/body`);
  }

  const weights = history.map((h) => Number(h.weightKg));
  const weighSummary =
    weights.length > 0
      ? t("bodyWeighSummary", {
          min: formatNum(Math.min(...weights), 1),
          max: formatNum(Math.max(...weights), 1),
          current: formatNum(weights[weights.length - 1] ?? 0, 1),
        })
      : null;

  const bmiRanges = [t("bodyBmiRange1"), t("bodyBmiRange2"), t("bodyBmiRange3"), t("bodyBmiRange4")];
  const ageLabel = locale === "en" ? String(ageYears) : toPersianDigits(ageYears);
  const activityLabel =
    ACTIVITIES.find((a) => a.level === defaultActivity)?.labelKey != null
      ? t(ACTIVITIES.find((a) => a.level === defaultActivity)!.labelKey)
      : defaultActivity;

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
        {hasProfile && (
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2">
            {t("bodyProfileSummary", {
              sex: t(defaultSex === "male" ? "male" : "female"),
              age: ageLabel,
              height: formatNum(defaultHeight),
              weight: formatNum(defaultWeight),
              activity: activityLabel,
            })}
          </p>
        )}
      </div>

      {/* Main Grid: Input Form (5 cols) & Results (7 cols) */}
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

        {/* Results (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
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

            <div className="pt-4 border-t border-outline-variant/20">
              <Link
                href={`/${locale}/profile/calorie`}
                className="w-full bg-primary hover:bg-primary/90 text-on-primary text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>{t("bodyBmiCta")}</span>
              </Link>
            </div>
          </div>

          {/* Health Registry Entry Card */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <ClipboardList size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg text-on-surface">
                  {t("bodyRegistryTitle")}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  {t("bodyRegistryDesc")}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20">
              <Link
                href={`/${locale}/profile/clinical`}
                className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>{t("bodyRegistryCta")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Weigh-ins: log + history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/20">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Scale size={24} aria-hidden="true" />
            </div>
            <h2 className="text-lg font-bold text-on-surface">{t("bodyWeighTitle")}</h2>
          </div>
          {error && (
            <p role="alert" className="text-error text-xs sm:text-sm font-bold mb-4">
              {t("bodyWeighError")}
            </p>
          )}
          <form action={logWeightAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="weigh-weight"
                className="text-xs sm:text-sm font-bold text-on-surface"
              >
                {t("bodyWeightLabel")}
              </label>
              <input
                id="weigh-weight"
                name="weightKg"
                type="number"
                step="0.5"
                min={25}
                max={300}
                defaultValue={defaultWeight}
                required
                className="w-full bg-surface-container-low rounded-xl px-3.5 py-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="weigh-date-picker"
                className="text-xs sm:text-sm font-bold text-on-surface"
              >
                {t("bodyWeighDateLabel")}
              </label>
              <JalaliDatePicker
                locale={locale}
                name="loggedAt"
                required
                id="weigh-date-picker"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all"
              >
                {t("bodyWeighCta")}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-on-surface">{t("bodyWeighHistoryTitle")}</h2>
          {weighSummary && (
            <p className="text-xs sm:text-sm text-on-surface-variant font-medium">
              {weighSummary}
            </p>
          )}
          {history.length === 0 ? (
            <p className="text-sm text-on-surface-variant">{t("bodyWeighEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 bg-surface-container-low rounded-xl px-4 py-3"
                >
                  <span className="text-xs sm:text-sm font-bold text-on-surface">
                    {formatNum(Number(h.weightKg), 1)}
                  </span>
                  <span className="text-[11px] sm:text-xs text-on-surface-variant">
                    {formatJalaliDate(`${h.loggedAt}T12:00:00Z`, locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
