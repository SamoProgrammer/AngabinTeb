import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import {
  getPhysiology,
  listPeriods,
  periodEntries,
} from "@/contexts/nutrition/queries";
import { createPeriod } from "@/contexts/nutrition/actions";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";
import { formatJalaliDate } from "@/lib/format";
import { toPersianDigits } from "@/lib/format";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  ClipboardList,
} from "lucide-react";

const ERROR_KEYS: Record<string, string> = {
  "invalid title": "calorieErrTitle",
  "invalid dates": "calorieErrDates",
  "end before start": "calorieErrOrder",
  "period too long": "calorieErrLong",
  "physiology required": "calorieErrPhysio",
};

const inputClass =
  "w-full bg-surface-container-low rounded-xl px-3.5 py-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30 text-start";

export default async function CalorieListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations("nutrition");
  const tm = await getTranslations("metabolism");
  const isRtl = locale !== "en";
  const ArrowIcon = locale === "en" ? ArrowRight : ArrowLeft;

  const [periods, profile] = await Promise.all([
    listPeriods(user.id),
    getPhysiology(user.id),
  ]);
  const counts = await Promise.all(
    periods.map((p) => periodEntries(user.id, p.id).then((e) => e.length)),
  );

  const errorKey =
    typeof error === "string" && error
      ? (ERROR_KEYS[error] ?? "calorieErrOther")
      : null;

  const digits = (v: string | number) =>
    locale === "en" ? String(v) : toPersianDigits(v);

  async function createPeriodAction(formData: FormData) {
    "use server";
    const weightRaw = String(formData.get("weightKg") ?? "").trim();
    const weightNum = weightRaw === "" ? NaN : Number(weightRaw);
    const res = await createPeriod({
      title: String(formData.get("title") ?? ""),
      startsOn: String(formData.get("startsOn") ?? ""),
      endsOn: String(formData.get("endsOn") ?? ""),
      weightKg: Number.isNaN(weightNum) ? undefined : weightNum,
    });
    if (!res.ok) {
      redirect(
        `/${locale}/profile/calorie?error=${encodeURIComponent(res.error)}`,
      );
    }
    redirect(`/${locale}/profile/calorie/${res.id}`);
  }

  return (
    <div className="flex flex-col gap-6 text-start" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {t("calorieTitle")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1">
            {t("calorieSubtitle")}
          </p>
        </div>
        <a
          href="#new"
          className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary py-3 px-6 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all self-start sm:self-auto"
        >
          <CalendarPlus size={20} aria-hidden="true" />
          <span>{t("calorieNewCta")}</span>
        </a>
      </div>

      {periods.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col items-start gap-4">
          <p className="text-sm sm:text-base text-on-surface-variant">
            {t("calorieEmpty")}
          </p>
          <a
            href="#new"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary py-3 px-6 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            <CalendarPlus size={20} aria-hidden="true" />
            <span>{t("calorieNewCta")}</span>
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {periods.map((p, i) => (
            <Link
              key={p.id}
              href={`/${locale}/profile/calorie/${p.id}`}
              className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-xs border border-outline-variant/30 hover:border-primary/40 hover:shadow-md transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ClipboardList size={22} aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-sm sm:text-base text-on-surface">
                    {p.title}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {formatJalaliDate(`${p.startsOn}T12:00:00Z`, locale)}
                    {" • "}
                    {formatJalaliDate(`${p.endsOn}T12:00:00Z`, locale)}
                  </p>
                  <p className="text-xs text-primary font-bold mt-1">
                    {t("calorieEntryCount", {
                      count: digits(counts[i] ?? 0),
                    })}
                  </p>
                </div>
              </div>
              <ArrowIcon
                size={20}
                className="text-on-surface-variant shrink-0"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      )}

      <section
        id="new"
        aria-label={t("calorieNewTitle")}
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 scroll-mt-24"
      >
        <h2 className="text-lg font-bold text-on-surface">
          {t("calorieNewTitle")}
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 mb-5">
          {profile ? t("caloriePhysioNote") : t("calorieNoProfile")}{" "}
          <Link
            href={`/${locale}/profile/body`}
            className="text-primary font-bold underline"
          >
            {t("caloriePhysioEdit")}
          </Link>
        </p>

        {errorKey && (
          <p
            role="alert"
            className="text-error text-xs sm:text-sm font-bold mb-4"
          >
            {t(errorKey)}
          </p>
        )}

        {!profile ? (
          <Link
            href={`/${locale}/profile/body`}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all"
          >
            <span>{t("caloriePhysioEdit")}</span>
          </Link>
        ) : (
        <form action={createPeriodAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="period-title"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {t("calorieFieldTitle")}
            </label>
            <input
              id="period-title"
              name="title"
              type="text"
              required
              maxLength={80}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="period-start-picker"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {t("calorieFieldStart")}
            </label>
            <JalaliDatePicker
              locale={locale}
              name="startsOn"
              required
              id="period-start-picker"
            />
          </div>
          <div>
            <label
              htmlFor="period-end-picker"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {t("calorieFieldEnd")}
            </label>
            <JalaliDatePicker
              locale={locale}
              name="endsOn"
              required
              id="period-end-picker"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="period-weight"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {tm("bodyWeightLabel")}
            </label>
            <input
              id="period-weight"
              name="weightKg"
              type="number"
              step="0.5"
              min={25}
              max={300}
              defaultValue={
                profile?.weightKg ? Number(profile.weightKg) : ""
              }
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all"
            >
              {t("calorieCreate")}
            </button>
          </div>
        </form>
        )}
      </section>
    </div>
  );
}
