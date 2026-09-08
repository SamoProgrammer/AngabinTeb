import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import {
  foodPickerOptions,
  getPeriod,
  periodEntries,
  periodTotals,
} from "@/contexts/nutrition/queries";
import { deleteIntake } from "@/contexts/nutrition/actions";
import { LogFood } from "@/components/nutrition/log-food";
import { formatJalaliDate, formatJalaliDateTime } from "@/lib/format";
import { formatPersianNumber, toPersianDigits } from "@/lib/metabolism";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

const ACTIVITY_KEYS: Record<string, string> = {
  sedentary: "bodyActSedentaryLabel",
  light: "bodyActLightLabel",
  moderate: "bodyActModerateLabel",
  active: "bodyActActiveLabel",
  very_active: "bodyActVeryActiveLabel",
};

export default async function CalorieDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ calc?: string }>;
}) {
  const user = await requireUser();
  const { locale, id } = await params;
  const { calc } = await searchParams;
  const t = await getTranslations("nutrition");
  const tm = await getTranslations("metabolism");
  const isRtl = locale !== "en";
  const BackIcon = locale === "en" ? ArrowLeft : ArrowRight;

  const period = await getPeriod(user.id, id);
  if (!period) notFound();

  const [entries, options] = await Promise.all([
    periodEntries(user.id, id),
    foodPickerOptions(locale),
  ]);

  const showResult = calc === "1";
  const result = showResult ? await periodTotals(user.id, id) : null;
  if (showResult && !result) notFound();

  const digits = (v: string | number) =>
    locale === "en" ? String(v) : toPersianDigits(v);
  const formatNum = (n: number) =>
    locale === "en" ? n.toLocaleString("en-US") : formatPersianNumber(n);

  const slotLabel: Record<string, string> = {
    breakfast: t("calorieSlotBreakfast"),
    lunch: t("calorieSlotLunch"),
    dinner: t("calorieSlotDinner"),
    snack: t("calorieSlotSnack"),
  };

  const consumed = result ? Math.round(result.totals["n-energy"] ?? 0) : 0;
  const remaining = result ? Math.max(0, result.tdee - consumed) : 0;
  const macroRows = result
    ? [
        {
          label: t("calorieProtein"),
          ate: Math.round(result.totals["n-protein"] ?? 0),
          goal: Math.round(result.macros.proteinGrams),
        },
        {
          label: t("calorieCarbs"),
          ate: Math.round(result.totals["n-carbs"] ?? 0),
          goal: Math.round(result.macros.carbGrams),
        },
        {
          label: t("calorieFat"),
          ate: Math.round(result.totals["n-fat"] ?? 0),
          goal: Math.round(result.macros.fatGrams),
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6 text-start" dir={isRtl ? "rtl" : "ltr"}>
      <Link
        href={`/${locale}/nutrition/calorie`}
        className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
      >
        <BackIcon size={16} aria-hidden="true" />
        <span>{t("calorieBack")}</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          {period.title}
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
          {formatJalaliDate(`${period.startsOn}T12:00:00Z`, locale)}
          {" • "}
          {formatJalaliDate(`${period.endsOn}T12:00:00Z`, locale)}
        </p>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-medium">
          {t("calorieProfileLine", {
            age: digits(period.age),
            weight: digits(Number(period.weightKg)),
            height: digits(Number(period.heightCm)),
          })}
          {" • "}
          {tm(ACTIVITY_KEYS[period.activityLevel] ?? "bodyActModerateLabel")}
        </p>
      </div>

      <section
        aria-label={t("calorieEntriesTitle")}
        className="flex flex-col gap-3"
      >
        <h2 className="text-lg font-bold text-on-surface">
          {t("calorieEntriesTitle")}
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            {t("calorieNoEntries")}
          </p>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-outline-variant/30 flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <UtensilsCrossed size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">
                    {e.foodName}
                    {e.mealSlot && slotLabel[e.mealSlot] && (
                      <span className="ms-2 bg-secondary-container/20 text-secondary text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {slotLabel[e.mealSlot]}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {digits(Number(e.quantity))} {e.servingUnitName}
                    {" • "}
                    {formatJalaliDateTime(e.loggedAt, locale)}
                  </p>
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteIntake(e.id);
                  redirect(
                    `/${locale}/nutrition/calorie/${id}${showResult ? "?calc=1" : ""}`,
                  );
                }}
              >
                <button
                  type="submit"
                  aria-label={t("calorieDelete")}
                  className="inline-flex items-center gap-1.5 text-error text-xs font-bold px-3 py-3 rounded-xl hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">{t("calorieDelete")}</span>
                </button>
              </form>
            </div>
          ))
        )}
      </section>

      <LogFood foods={options} locale={locale} periodId={id} />

      {result ? (
        <section
          aria-label={t("calorieResultTitle")}
          className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col gap-5"
        >
          <h2 className="text-lg font-bold text-on-surface">
            {t("calorieResultTitle")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t("calorieBmr"), value: result.bmr },
              { label: t("calorieTdee"), value: result.tdee },
              { label: t("calorieConsumed"), value: consumed },
              { label: t("calorieRemaining"), value: remaining },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface-container-low rounded-2xl p-4 text-center"
              >
                <p className="text-[11px] sm:text-xs text-on-surface-variant font-medium">
                  {s.label}
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-primary mt-1">
                  {formatNum(s.value)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {macroRows.map((m) => {
              const pct =
                m.goal > 0 ? Math.min(100, Math.round((m.ate / m.goal) * 100)) : 0;
              return (
                <div key={m.label}>
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-1.5">
                    <span className="font-bold text-on-surface">{m.label}</span>
                    <span className="text-on-surface-variant font-medium">
                      {formatNum(m.ate)} / {formatNum(m.goal)} {t("dashGramUnit")}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={m.label}
                    className="h-2.5 rounded-full bg-surface-container overflow-hidden"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col items-start gap-4">
          <p className="text-sm text-on-surface-variant">
            {t("calorieCalcHint")}
          </p>
          <Link
            href={`/${locale}/nutrition/calorie/${id}?calc=1`}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all"
          >
            <Calculator size={20} aria-hidden="true" />
            <span>{t("calorieCalcCta")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
