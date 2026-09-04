import Link from "next/link";
import { requireUser } from "@/contexts/identity/actions";
import { dayIntake, foodPickerOptions, getPhysiology } from "@/contexts/nutrition/queries";
import { LogFood } from "@/components/nutrition/log-food";
import {
  formatPersianNumber,
  toPersianDigits,
  calculateMacros,
} from "@/lib/metabolism";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

export default async function DiaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { locale } = await params;
  const { day: dayParam } = await searchParams;
  const user = await requireUser();

  const today = new Date().toISOString().slice(0, 10);
  const rawDay = dayParam ?? today;
  const day =
    dayPattern.test(rawDay) && !Number.isNaN(Date.parse(`${rawDay}T00:00:00Z`))
      ? rawDay
      : today;

  const [{ intakes, totals }, options, profile] = await Promise.all([
    dayIntake(user.id, day),
    foodPickerOptions(locale),
    getPhysiology(user.id),
  ]);

  const targetTdee = profile?.tdee ?? 1850;
  const energyKcal = Math.round(totals["n-energy"] ?? 0);
  const carbsG = Math.round(totals["n-carbs"] ?? 0);
  const proteinG = Math.round(totals["n-protein"] ?? 0);
  const fatG = Math.round(totals["n-fat"] ?? 0);

  const remainingKcal = Math.max(0, targetTdee - energyKcal);
  const caloriePercent = Math.min(100, Math.round((energyKcal / targetTdee) * 100));

  const macroGoals = calculateMacros(targetTdee);
  const carbGoal = macroGoals.carbGrams || 220;
  const proteinGoal = macroGoals.proteinGrams || 110;
  const fatGoal = macroGoals.fatGrams || 55;

  // 7-day strip
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="flex flex-col gap-8 text-right" dir="rtl">
      {/* 1. Top Header & Date Pill (Screen #11) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ClinicalIcon name="restaurant" size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">
              دفترچه غذایی و کالری روزانه
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              پایش ساده و هدفمند وعده‌های غذایی و دریافت کالری
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl text-on-surface text-xs sm:text-sm font-bold border border-outline-variant/30 self-start sm:self-auto">
          <ClinicalIcon name="calendar_today" size={18} className="text-primary" />
          <span>تاریخ پایش: {toPersianDigits(day)}</span>
        </div>
      </div>

      {/* 2. Daily Intake Progress & Macro Cards (Screen #11) */}
      <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
              کالری مصرفی امروز
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-bold text-primary font-data-metric">
                {formatPersianNumber(energyKcal)}
              </span>
              <span className="text-xs sm:text-sm text-on-surface-variant">
                / {formatPersianNumber(targetTdee)} Kcal هدف
              </span>
              {/* Preserves numeric kcal value visible in text for Playwright contract */}
              <span className="text-xs text-on-surface-variant opacity-75">
                ({energyKcal} kcal)
              </span>
            </div>
          </div>

          <div className="text-right sm:text-left">
            <span className="text-base sm:text-lg font-bold text-secondary">
              {formatPersianNumber(remainingKcal)} Kcal باقیمانده
            </span>
            <span className="block text-xs text-on-surface-variant mt-0.5">
              {toPersianDigits(caloriePercent)}٪ هدف تکمیل شده
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-700"
            style={{ width: `${caloriePercent}%` }}
          />
        </div>

        {/* 3 Macro Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-outline-variant/20 text-center sm:text-right">
          <div className="bg-surface-container-low/60 p-3 rounded-2xl border border-outline-variant/20">
            <span className="text-xs text-on-surface-variant block">پروتئین</span>
            <span className="text-sm sm:text-base font-bold text-on-surface block mt-1">
              {toPersianDigits(proteinG)}{" "}
              <span className="text-xs font-normal text-on-surface-variant">
                / {toPersianDigits(proteinGoal)} گرم
              </span>
            </span>
          </div>

          <div className="bg-surface-container-low/60 p-3 rounded-2xl border border-outline-variant/20">
            <span className="text-xs text-on-surface-variant block">کربوهیدرات</span>
            <span className="text-sm sm:text-base font-bold text-on-surface block mt-1">
              {toPersianDigits(carbsG)}{" "}
              <span className="text-xs font-normal text-on-surface-variant">
                / {toPersianDigits(carbGoal)} گرم
              </span>
            </span>
          </div>

          <div className="bg-surface-container-low/60 p-3 rounded-2xl border border-outline-variant/20">
            <span className="text-xs text-on-surface-variant block">چربی</span>
            <span className="text-sm sm:text-base font-bold text-on-surface block mt-1">
              {toPersianDigits(fatG)}{" "}
              <span className="text-xs font-normal text-on-surface-variant">
                / {toPersianDigits(fatGoal)} گرم
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Logged Meals for this Day & Quick Logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Logged Foods List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-on-surface">
              وعده‌های ثبت‌شده برای این روز
            </h2>
            <span className="text-xs text-on-surface-variant">
              {toPersianDigits(intakes.length)} مورد ثبت شده
            </span>
          </div>

          {intakes.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-8 text-center border border-dashed border-outline-variant/40 flex flex-col items-center justify-center">
              <ClinicalIcon name="restaurant_menu" size={36} className="text-on-surface-variant/50 mb-2" />
              <p className="text-sm font-bold text-on-surface">
                هنوز خوراکی برای این تاریخ ثبت نشده است.
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                از فرم روبرو، وعده غذایی یا میان‌وعده خود را با مقیاس‌های سنتی ثبت فرمایید.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {intakes.map((i) => (
                <div
                  key={i.id}
                  className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <ClinicalIcon name="lunch_dining" size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-on-surface">
                        {i.foodName}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        مقیاس: {i.servingUnitName} × {toPersianDigits(i.quantity)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left flex flex-col items-end">
                    <span className="text-xs text-on-surface-variant">
                      {new Date(i.loggedAt).toLocaleTimeString("fa-IR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Food Logger Form (5 cols) */}
        <div className="lg:col-span-5">
          <LogFood foods={options} />
        </div>
      </div>

      {/* 4. Date Pagination Navigator */}
      <nav
        aria-label="پیمایش روزهای هفته"
        className="bg-surface-container-lowest p-4 sm:p-5 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
          انتخاب تاریخ پرونده:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {days.map((d) => {
            const isSelected = d === day;
            return (
              <Link
                key={d}
                href={`?day=${d}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                {toPersianDigits(d)}
                {d === today && " (امروز)"}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}