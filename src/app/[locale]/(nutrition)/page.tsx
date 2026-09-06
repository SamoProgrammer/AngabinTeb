import Link from "next/link";
import { requireUser } from "@/contexts/identity/actions";
import { getPhysiology, dayIntake } from "@/contexts/nutrition/queries";
import {
  formatPersianNumber,
  toPersianDigits,
  calculateBmi,
  calculateMacros,
} from "@/lib/metabolism";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function NutritionHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const user = await requireUser();
  const { locale } = await params;
  const today = new Date().toISOString().slice(0, 10);

  const [profile, intakeData] = await Promise.all([
    getPhysiology(user.id),
    dayIntake(user.id, today),
  ]);

  // Anthropometrics
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

  return (
    <div className="flex flex-col gap-8 text-start" dir="rtl">
      {/* 1. Header & Anthropometric Metric Bar (Screen #14) */}
      <section aria-label="شاخص‌های آنتروپومتریک بدنی">
        <div className="flex flex-col mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            پیشخوان پایش تغذیه و سلامت
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1">
            خوش‌آمدید! وضعیت فعلی شاخص‌های بدنی، تراز کالری و بیلان تغذیه امروز شما.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Current Weight */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                وزن فعلی
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-primary font-data-metric">
                  {formatPersianNumber(currentWeight, { decimals: 1 })}
                </span>
                <span className="text-xs text-on-surface-variant">کیلوگرم</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ClinicalIcon name="monitor_weight" size={26} />
            </div>
          </div>

          {/* Card 2: Target Weight */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                وزن هدف
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-secondary font-data-metric">
                  {formatPersianNumber(targetWeight, { decimals: 1 })}
                </span>
                <span className="text-xs text-on-surface-variant">کیلوگرم</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <ClinicalIcon name="flag" size={26} />
            </div>
          </div>

          {/* Card 3: Height */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                قد ثبت‌شده
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-on-surface font-data-metric">
                  {toPersianDigits(heightCm)}
                </span>
                <span className="text-xs text-on-surface-variant">سانتی‌متر</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface shrink-0">
              <ClinicalIcon name="straighten" size={26} />
            </div>
          </div>

          {/* Card 4: BMI */}
          <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-on-surface-variant">
                شاخص توده بدنی (BMI)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-bold text-primary font-data-metric">
                  {formatPersianNumber(bmiInfo.bmi, { decimals: 1 })}
                </span>
                <span className="text-xs font-bold text-primary">
                  ({bmiInfo.label})
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ClinicalIcon name="health_metrics" size={26} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Today's Intake & Macro Balance Interactive Widget (Screen #14) */}
      <section
        aria-label="بیلان انرژی و تراز درشت‌مغذی‌ها"
        className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ClinicalIcon name="pie_chart" size={24} className="text-primary" />
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                بیلان انرژی و تراز درشت‌مغذی‌ها (امروز)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              پایش بلادرنگ هیدراتاسیون، کالری، و تعادل هورمونی قند و پروتئین در پلتفرم انگبین طب
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-surface-container-high rounded-xl text-on-surface-variant text-xs sm:text-sm font-semibold">
              محدوده سوخت‌وساز پایه: {formatPersianNumber(bmr)} Kcal
            </span>
            <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-xl text-xs sm:text-sm">
              هدف کل: {formatPersianNumber(tdee)} Kcal
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
                  کالری دریافت‌شده
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-primary my-1 font-data-metric">
                  {formatPersianNumber(consumedKcal)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-secondary">
                  {formatPersianNumber(remainingKcal)} کالری تا سقف مجاز
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-4 text-center">
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                <span className="text-xs text-on-surface-variant block">مجاز روزانه</span>
                <p className="text-base sm:text-lg font-bold text-on-surface mt-0.5">
                  {formatPersianNumber(tdee)} <span className="text-xs font-normal">کالری</span>
                </p>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                <span className="text-xs text-on-surface-variant block">باقی‌مانده مجاز</span>
                <p className="text-base sm:text-lg font-bold text-secondary mt-0.5">
                  {formatPersianNumber(remainingKcal)} <span className="text-xs font-normal">کالری</span>
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
                    کربوهیدرات پیچیده و ساده
                  </span>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    (نان سنگک، برنج طارم، جو دوسر)
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-on-surface">
                  <span className="font-bold text-sm sm:text-base">
                    {toPersianDigits(consumedCarbs)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    / {toPersianDigits(carbTarget)} گرم ({toPersianDigits(carbsPct)}٪)
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
                  {toPersianDigits(Math.max(0, carbTarget - consumedCarbs))} گرم مجاز برای سایر وعده‌ها
                </span>
                <span className="text-secondary font-bold">تثبیت قند خون: عالی</span>
              </div>
            </div>

            {/* Proteins */}
            <div className="bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    پروتئین خالص
                  </span>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    (سینه مرغ، تخم‌مرغ رسمی، عدس)
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-on-surface">
                  <span className="font-bold text-sm sm:text-base">
                    {toPersianDigits(consumedProtein)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    / {toPersianDigits(proteinTarget)} گرم ({toPersianDigits(proteinPct)}٪)
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
                  {toPersianDigits(Math.max(0, proteinTarget - consumedProtein))} گرم مانده تا تکمیل نیاز عضله‌سازی
                </span>
                <span className="text-primary font-bold">شاخص آمینواسید: متعادل</span>
              </div>
            </div>

            {/* Healthy Fats */}
            <div className="bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary" />
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    چربی‌های مفید و غیراشباع
                  </span>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    (روغن زیتون فرابکر، گردوی تویسرکان)
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-on-surface">
                  <span className="font-bold text-sm sm:text-base">
                    {toPersianDigits(consumedFat)}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    / {toPersianDigits(fatTarget)} گرم ({toPersianDigits(fatPct)}٪)
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
                  {toPersianDigits(Math.max(0, fatTarget - consumedFat))} گرم مانده (مناسب چاشنی زیتون پرورده)
                </span>
                <span className="text-tertiary font-bold">پروفایل لیپید: سلامت قلب</span>
              </div>
            </div>

            {/* Hydration Indicator */}
            <div className="flex items-center justify-between bg-surface-container p-3 sm:p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <ClinicalIcon name="water_drop" size={20} className="text-primary" />
                <span className="text-xs sm:text-sm font-semibold text-on-surface">
                  مصرف آب و عرقیجات سنتی:
                </span>
                <span className="text-xs sm:text-sm font-bold text-primary">
                  ۶ لیوان از ۸ لیوان (۷۵٪)
                </span>
              </div>
              <span className="text-xs text-on-surface-variant bg-surface-container-lowest px-2.5 py-1 rounded-lg">
                هیدراتاسیون مناسب
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Key Operational Action Shortcuts (Bento Grid) (Screen #14) */}
      <section aria-label="میانبرهای سریع بالینی">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClinicalIcon name="bolt" size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-on-surface">
              دستورات و میانبرهای سریع بالینی
            </h2>
          </div>
          <span className="text-xs text-on-surface-variant">
            دسترسی مستقیم به ماژول‌های پرونده تغذیه
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
                <ClinicalIcon name="restaurant" size={24} />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                <ClinicalIcon name="arrow_back" size={18} />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                ثبت وعده در دفترچه کالری‌شمار
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                ثبت خوراک و میان‌وعده‌های مصرفی با مقیاس‌های سنتی و محاسبه آنی کالری.
              </p>
            </div>
            <div className="mt-4 pt-2 text-primary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>ورود به ثبت سریع</span>
              <ClinicalIcon name="chevron_left" size={16} />
            </div>
          </Link>

          {/* Action 2: Recalculate BMR/TDEE */}
          <Link
            href={`/${locale}/nutrition/body`}
            className="group bg-surface-container-lowest hover:bg-surface-bright rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ClinicalIcon name="calculate" size={24} />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-tertiary transition-colors">
                <ClinicalIcon name="arrow_back" size={18} />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-tertiary transition-colors">
                محاسبه شاخص‌های فیزیولوژیک
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                تنظیم مجدد BMR و TDEE طبق تغییرات هفتگی وزن و سطح تحرک ورزشی.
              </p>
            </div>
            <div className="mt-4 pt-2 text-tertiary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>محاسبه‌گر متابولیسم</span>
              <ClinicalIcon name="chevron_left" size={16} />
            </div>
          </Link>

          {/* Action 3: Persian Food Database */}
          <Link
            href={`/${locale}/nutrition/foods`}
            className="group bg-surface-container-lowest hover:bg-surface-bright rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ClinicalIcon name="menu_book" size={24} />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-secondary transition-colors">
                <ClinicalIcon name="arrow_back" size={18} />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-secondary transition-colors">
                بانک ارزش غذایی خوراک‌ها
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                اطلاعات کالری و درشت‌مغذی‌ها بر اساس پیمانه‌های معمول روزمره.
              </p>
            </div>
            <div className="mt-4 pt-2 text-secondary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>جستجو در غذاها</span>
              <ClinicalIcon name="chevron_left" size={16} />
            </div>
          </Link>

          {/* Action 4: Clinical Dietitian Consultation */}
          <Link
            href={`/${locale}/nutrition/diet`}
            className="group bg-surface-container-lowest hover:bg-surface-bright rounded-2xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between text-start"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ClinicalIcon name="clinical_notes" size={24} />
              </div>
              <span className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                <ClinicalIcon name="arrow_back" size={18} />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                برنامه‌های رژیم بالینی
              </h3>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                برنامه‌های غذایی کنترل قند، چربی کبد و مدیریت وزن.
              </p>
            </div>
            <div className="mt-4 pt-2 text-primary font-bold text-xs flex items-center gap-1 border-t border-outline-variant/20">
              <span>مشاهده برنامه‌ها</span>
              <ClinicalIcon name="chevron_left" size={16} />
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Today's Logged Meals Summary (Screen #14) */}
      <section aria-label="دفترچه وعده‌های غذایی امروز">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ClinicalIcon name="receipt_long" size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-on-surface">
              دفترچه وعده‌های غذایی امروز
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-on-surface-variant">
              مجموع انرژی مصرف‌شده:
            </span>
            <span className="text-sm sm:text-base font-bold text-primary">
              {formatPersianNumber(consumedKcal)} Kcal
            </span>
          </div>
        </div>

        {!intakeData?.intakes || intakeData.intakes.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-xs border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ClinicalIcon name="restaurant" size={30} />
            </div>
            <div className="max-w-md">
              <p className="text-sm sm:text-base text-on-surface font-medium leading-relaxed">
                امروز وعده‌ای ثبت نشده است. با ثبت اولین وعده، نمودار تراز درشت‌مغذی‌ها و کالری مصرفی شما فعال می‌شود.
              </p>
            </div>
            <Link
              href={`/${locale}/nutrition/diary`}
              className="bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <ClinicalIcon name="add" size={18} />
              <span>ثبت اولین وعده</span>
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
                        <ClinicalIcon name="restaurant" size={20} />
                      </span>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-on-surface">{intake.foodName}</h3>
                        <span className="text-[11px] text-on-surface-variant">
                          {new Date(intake.loggedAt).toLocaleTimeString("fa-IR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">مقدار مصرف:</span>
                    <span className="font-bold text-on-surface">
                      {toPersianDigits(intake.quantity)} {intake.servingUnitName}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-2 flex items-center justify-between border-t border-outline-variant/20 text-xs">
                  <span className="text-primary font-medium flex items-center gap-1">
                    <ClinicalIcon name="check_circle" size={14} />
                    <span>ثبت‌شده در پرونده</span>
                  </span>
                </div>
              </div>
            ))}
            {/* Quick add more card */}
            <div className="bg-surface-container-low/70 rounded-2xl p-4 border border-dashed border-primary/40 flex flex-col justify-between items-center text-center">
              <div className="w-12 h-12 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center my-2 shadow-2xs">
                <ClinicalIcon name="add" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-on-surface">ثبت وعده جدید</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  سقف مجاز باقی‌مانده: {toPersianDigits(remainingKcal)} Kcal
                </p>
              </div>
              <Link
                href={`/${locale}/nutrition/diary`}
                className="mt-3 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1"
              >
                <ClinicalIcon name="add" size={16} />
                <span>ثبت در دفترچه</span>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 5. Featured Clinical Diet Plans Preview (Screen #14 & #16) */}
      <section aria-label="برنامه‌های بالینی ویژه">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClinicalIcon name="spa" size={22} className="text-primary" />
            <h2 className="text-xl font-bold text-on-surface">
              برنامه‌های رژیم درمانی منتخب انگبین طب
            </h2>
          </div>
          <Link
            href={`/${locale}/nutrition/diet`}
            className="text-xs sm:text-sm font-bold text-primary hover:text-primary-container transition-colors flex items-center gap-1"
          >
            <span>مشاهده همه پروتکل‌ها</span>
            <ClinicalIcon name="chevron_left" size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan 1 */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  کبد چرب و سندرم متابولیک
                </span>
                <span className="text-xs text-on-surface-variant font-medium">۳۰ روزه</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">
                برنامه طلایی پاکسازی کبد و مقاومت انسولین
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                مهندسی غذایی جهت شکستن رسوب چربی احشایی با کاسنی، روغن زیتون بکر و حبوبات سنتی.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">طراحی: دکتر لیلا سادات</span>
              <Link
                href={`/${locale}/nutrition/diet`}
                className="text-primary font-bold text-xs hover:underline"
              >
                بررسی برنامه
              </Link>
            </div>
          </div>

          {/* Plan 2 */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-secondary/10 text-secondary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  دیابت و پایش گلیسمی
                </span>
                <span className="text-xs text-on-surface-variant font-medium">۶۰ روزه</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">
                پروتکل بالینی کنترل بار گلیسمی سفره ایرانی
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                حفظ برنج و نان سنتی با تکیه بر شاخص گلیسمی کته و سالاد شیرازی با آبغوره جهرم.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">طراحی: دکتر احمد رضایی</span>
              <Link
                href={`/${locale}/nutrition/diet`}
                className="text-secondary font-bold text-xs hover:underline"
              >
                بررسی برنامه
              </Link>
            </div>
          </div>

          {/* Plan 3 */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-tertiary/10 text-tertiary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  کارمندان و سلامت شرکتی
                </span>
                <span className="text-xs text-on-surface-variant font-medium">۹۰ روزه</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">
                بسته سلامت سازمانی و رفع خستگی مفرط اداری
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                تعدیل میان‌وعده‌ها و وعده ناهار اداری جهت پیشگیری از افت انرژی پس از صرف غذا.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">طراحی: کلینیک متابولیک</span>
              <Link
                href={`/${locale}/nutrition/diet`}
                className="text-tertiary font-bold text-xs hover:underline"
              >
                بررسی برنامه
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}