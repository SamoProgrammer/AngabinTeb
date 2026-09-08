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
import { formatJalaliDate } from "@/lib/format";
import { toPersianDigits } from "@/lib/metabolism";
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
    const num = (v: FormDataEntryValue | null) => {
      if (v === null || String(v).trim() === "") return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    };
    const str = (v: FormDataEntryValue | null) => {
      const s = String(v ?? "").trim();
      return s === "" ? undefined : (s as "male" | "female");
    };
    const activityRaw = String(formData.get("activityLevel") ?? "").trim();
    const res = await createPeriod({
      title: String(formData.get("title") ?? ""),
      startsOn: String(formData.get("startsOn") ?? ""),
      endsOn: String(formData.get("endsOn") ?? ""),
      sex: str(formData.get("sex")),
      age: num(formData.get("age")),
      weightKg: num(formData.get("weightKg")),
      heightCm: num(formData.get("heightCm")),
      activityLevel: (
        ["sedentary", "light", "moderate", "active", "very_active"] as const
      ).includes(activityRaw as "moderate")
        ? (activityRaw as
            | "sedentary"
            | "light"
            | "moderate"
            | "active"
            | "very_active")
        : undefined,
    });
    if (!res.ok) {
      redirect(
        `/${locale}/nutrition/calorie?error=${encodeURIComponent(res.error)}`,
      );
    }
    redirect(`/${locale}/nutrition/calorie/${res.id}`);
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
              href={`/${locale}/nutrition/calorie/${p.id}`}
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
            href={`/${locale}/nutrition/body`}
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
              htmlFor="period-start"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {t("calorieFieldStart")}
            </label>
            <input
              id="period-start"
              name="startsOn"
              type="date"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="period-end"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {t("calorieFieldEnd")}
            </label>
            <input
              id="period-end"
              name="endsOn"
              type="date"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="period-sex"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {tm("bodySexLabel")}
            </label>
            <select
              id="period-sex"
              name="sex"
              defaultValue={(profile?.sex as string) ?? ""}
              className={inputClass}
            >
              <option value="male">{tm("male")}</option>
              <option value="female">{tm("female")}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="period-age"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {t("calorieFieldAge")}
            </label>
            <input
              id="period-age"
              name="age"
              type="number"
              min={0}
              max={120}
              defaultValue={profile?.age ?? ""}
              className={inputClass}
            />
          </div>
          <div>
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
          <div>
            <label
              htmlFor="period-height"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {tm("bodyHeightLabel")}
            </label>
            <input
              id="period-height"
              name="heightCm"
              type="number"
              step="0.5"
              min={80}
              max={250}
              defaultValue={
                profile?.heightCm ? Number(profile.heightCm) : ""
              }
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="period-activity"
              className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
            >
              {tm("bodyActivityLabel")}
            </label>
            <select
              id="period-activity"
              name="activityLevel"
              defaultValue={profile?.activityLevel ?? "moderate"}
              className={inputClass}
            >
              <option value="sedentary">{tm("bodyActSedentaryLabel")}</option>
              <option value="light">{tm("bodyActLightLabel")}</option>
              <option value="moderate">{tm("bodyActModerateLabel")}</option>
              <option value="active">{tm("bodyActActiveLabel")}</option>
              <option value="very_active">{tm("bodyActVeryActiveLabel")}</option>
            </select>
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
      </section>
    </div>
  );
}
