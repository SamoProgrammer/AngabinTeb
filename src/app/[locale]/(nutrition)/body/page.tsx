import { requireUser } from "@/contexts/identity/actions";
import { getPhysiology } from "@/contexts/nutrition/queries";
import { savePhysiology } from "@/contexts/nutrition/actions";
import {
  formatPersianNumber,
  calculateBmi,
  calculateBmr,
  calculateTdee,
} from "@/lib/metabolism";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function BodyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const user = await requireUser();
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

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdeeValue =
    profile?.tdee ??
    calculateTdee(bmrValue, activityMultipliers[defaultActivity] ?? 1.55);

  const bmiResult = calculateBmi(defaultWeight, defaultHeight);

  // Goal targets
  const deficitCal = Math.max(1200, tdeeValue - 400);
  const maintainCal = tdeeValue;
  const surplusCal = tdeeValue + 300;

  return (
    <div className="flex flex-col gap-8 text-right" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          محاسبه متابولیسم و نمایه زیستی بدنی
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant mt-1">
          برآورد دقیق انرژی مصرفی روزانه بر اساس استانداردهای معتبر بالینی Mifflin-St Jeor.
        </p>
      </div>

      {/* Main Grid: Input Form (5 cols) & Results (7 cols) (Screen #41) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-outline-variant/20">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ClinicalIcon name="accessibility_new" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">مشخصات فیزیولوژیک</h2>
              <p className="text-xs text-on-surface-variant">اطلاعات برای محاسبه BMR و TDEE</p>
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
              <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center justify-between">
                <span>جنسیت بیولوژیک</span>
                <span className="text-[11px] text-on-surface-variant font-normal">
                  جهت اعمال ضریب هورمونی
                </span>
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
                    <ClinicalIcon name="male" size={20} />
                    <span>آقا (مرد)</span>
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
                    <ClinicalIcon name="female" size={20} />
                    <span>خانم (زن)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Birth Date */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="birthDate"
                className="text-xs sm:text-sm font-bold text-on-surface"
              >
                تاریخ تولد (میلادی)
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={defaultBirthDate}
                required
                className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30"
              />
            </div>

            {/* Height & Weight Dual Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="heightCm"
                  className="text-xs sm:text-sm font-bold text-on-surface"
                >
                  قد ایستاده (cm)
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
                  وزن ناشتا (kg)
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

            {/* Physical Activity Level (PAL) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-bold text-on-surface flex items-center justify-between">
                <span>سطح تحرک و فعالیت فیزیکی</span>
                <span className="text-[11px] text-secondary font-semibold">ضریب PAL</span>
              </label>

              <div className="flex flex-col gap-2">
                {[
                  {
                    level: "sedentary",
                    label: "بدون تحرک",
                    desc: "کار اداری و پشت‌میزنشینی مطلق",
                    factor: "۱٫۲×",
                    icon: "airline_seat_recline_normal",
                  },
                  {
                    level: "light",
                    label: "فعالیت سبک",
                    desc: "۱ الی ۳ روز پیاده‌روی یا ورزش سبک در هفته",
                    factor: "۱٫۳۷۵×",
                    icon: "directions_walk",
                  },
                  {
                    level: "moderate",
                    label: "فعالیت متوسط",
                    desc: "۳ الی ۵ روز تمرین ورزشی با شدت متوسط",
                    factor: "۱٫۵۵×",
                    icon: "fitness_center",
                  },
                  {
                    level: "active",
                    label: "فعالیت شدید",
                    desc: "ورزش سنگین روزانه یا شغل پرتحرک بدنی",
                    factor: "۱٫۷۲۵×",
                    icon: "sprint",
                  },
                  {
                    level: "very_active",
                    label: "بسیار شدید",
                    desc: "ورزشکاران حرفه‌ای یا کار طاقت‌فرسا",
                    factor: "۱٫۹×",
                    icon: "sports_mma",
                  },
                ].map((act) => (
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
                        <ClinicalIcon name={act.icon} size={20} />
                        <div className="flex flex-col">
                          <span className="font-bold text-xs sm:text-sm">{act.label}</span>
                          <span className="text-[11px] opacity-80">{act.desc}</span>
                        </div>
                      </div>
                      <span className="text-xs opacity-70 font-semibold">{act.factor}</span>
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
              <ClinicalIcon name="save" size={20} />
              <span>محاسبه و ذخیره در پرونده سلامت</span>
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
                    متابولیسم پایه (BMR)
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-primary font-data-metric">
                      {formatPersianNumber(bmrValue)}
                    </span>
                    <span className="text-xs text-on-surface-variant">کیلوکالری/روز</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ClinicalIcon name="bolt" size={26} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                انرژی حداقلی مورد نیاز ارگان‌های حیاتی بدن در وضعیت استراحت کامل شبانه‌روزی.
              </p>
            </div>

            {/* TDEE Card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-semibold text-secondary">
                    کالری مصرفی کل (TDEE)
                  </span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-secondary font-data-metric">
                      {formatPersianNumber(tdeeValue)}
                    </span>
                    <span className="text-xs text-on-surface-variant">کیلوکالری/روز</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <ClinicalIcon name="local_fire_department" size={26} />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                کل کالری مورد نیاز روزانه همراه با میزان فعالیت فیزیکی جهت تثبیت دقیق وزن.
              </p>
            </div>
          </div>

          {/* BMI Card with Visual Bar */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ClinicalIcon name="scale" size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-on-surface">
                    شاخص توده بدنی (BMI)
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    نسبت وزن به توان دوم قد در بازه تشخیصی
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-primary/10 px-3.5 py-1 rounded-full text-primary font-bold text-sm">
                <span>شاخص:</span>
                <span>{formatPersianNumber(bmiResult.bmi, { decimals: 1 })}</span>
                <span className="text-xs font-normal">({bmiResult.label})</span>
              </div>
            </div>

            {/* Segmented Color Bar */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="w-full h-3 rounded-full bg-surface-container overflow-hidden flex">
                <div className="h-full bg-blue-300 w-[18.5%]" title="کمبود وزن" />
                <div className="h-full bg-primary w-[31%]" title="نرمال" />
                <div className="h-full bg-secondary-container w-[25%]" title="اضافه وزن" />
                <div className="h-full bg-error w-[25.5%]" title="چاقی بالینی" />
              </div>
              <div className="grid grid-cols-4 text-center text-[11px] text-on-surface-variant pt-1">
                <div>کمبود وزن (&lt; ۱۸٫۵)</div>
                <div className="text-primary font-bold">نرمال (۱۸٫۵ - ۲۴٫۹)</div>
                <div>اضافه وزن (۲۵ - ۲۹٫۹)</div>
                <div>چاقی (&gt; ۳۰)</div>
              </div>
            </div>
          </div>

          {/* Daily Calorie Targets by Goal */}
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
            <h2 className="font-bold text-base sm:text-lg text-on-surface">
              برنامه کالری روزانه بر اساس هدف شما
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Deficit */}
              <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col justify-between border border-outline-variant/20">
                <span className="font-bold text-xs sm:text-sm text-on-surface">
                  کاهش وزن آرام
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  کسری کنترل‌شده سالم
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-extrabold text-xl text-on-surface font-data-metric">
                    {formatPersianNumber(deficitCal)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">کالری</span>
                </div>
              </div>

              {/* Maintenance */}
              <div className="bg-primary/10 p-4 rounded-2xl flex flex-col justify-between border border-primary/20">
                <span className="font-bold text-xs sm:text-sm text-primary">تثبیت وزن</span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  حفظ وزن و انرژی متوازن
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-extrabold text-xl text-primary font-data-metric">
                    {formatPersianNumber(maintainCal)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">کالری</span>
                </div>
              </div>

              {/* Surplus */}
              <div className="bg-surface-container-low p-4 rounded-2xl flex flex-col justify-between border border-outline-variant/20">
                <span className="font-bold text-xs sm:text-sm text-on-surface">
                  افزایش وزن تمیز
                </span>
                <span className="text-[11px] text-on-surface-variant mt-0.5">
                  افزایش تدریجی توده عضلانی
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-extrabold text-xl text-on-surface font-data-metric">
                    {formatPersianNumber(surplusCal)}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">کالری</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}