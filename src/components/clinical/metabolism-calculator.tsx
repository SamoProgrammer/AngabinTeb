"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import {
  calculateBmr,
  calculateTdee,
  calculateBmi,
  formatPersianNumber,
} from "@/lib/metabolism";

export interface ActivityOption {
  value: number;
  label: string;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 1.2, label: "کم‌تحرک (کار پشت‌میزی، بدون ورزش مشخص)" },
  { value: 1.375, label: "سبک (ورزش ۱ تا ۲ روز در هفته)" },
  { value: 1.55, label: "متوسط (ورزش منظم ۳ تا ۵ روز در هفته)" },
  { value: 1.725, label: "فعال و ورزشکار (۶ الی ۷ روز تمرین بدنی)" },
  { value: 1.9, label: "بسیار فعال (تمرینات حرفه‌ای سنگین یا کار بدنی شدید)" },
];

export interface MetabolismCalculatorProps {
  locale?: string;
  className?: string;
  initialGender?: "male" | "female";
  initialAge?: number;
  initialHeight?: number;
  initialWeight?: number;
  initialActivity?: number;
  diaryHref?: string;
}

export function MetabolismCalculator({
  locale = "fa",
  className = "",
  initialGender = "male",
  initialAge = 32,
  initialHeight = 175,
  initialWeight = 69,
  initialActivity = 1.375,
  diaryHref,
}: MetabolismCalculatorProps) {
  const [gender, setGender] = useState<"male" | "female">(initialGender);
  const [age, setAge] = useState<number>(initialAge);
  const [height, setHeight] = useState<number>(initialHeight);
  const [weight, setWeight] = useState<number>(initialWeight);
  const [activity, setActivity] = useState<number>(initialActivity);

  const bmr = useMemo(
    () => calculateBmr({ gender, weightKg: weight, heightCm: height, ageYears: age }),
    [gender, weight, height, age]
  );

  const tdee = useMemo(
    () => calculateTdee(bmr, activity),
    [bmr, activity]
  );

  const bmiResult = useMemo(
    () => calculateBmi(weight, height),
    [weight, height]
  );

  const targetDiaryHref = diaryHref ?? `/${locale}/nutrition/diary`;

  return (
    <section
      id="metabolism-widget"
      dir="rtl"
      aria-label="محاسبه‌گر بالینی سوخت‌وساز و متابولیسم"
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full ${className}`}
    >
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg relative overflow-hidden border border-outline-variant/30">
        <div className="absolute -bottom-20 -start-20 w-80 h-80 bg-primary/5 rounded-full pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Column 1: Inputs Form */}
          <div className="lg:col-span-7 text-start flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 bg-surface-container-low px-3 py-1 rounded-full mb-3">
                <ClinicalIcon name="calculate" size={18} className="text-secondary" />
                <span className="font-bold text-xs sm:text-sm text-secondary">
                  محاسبه‌گر بالینی سوخت‌وساز پایه
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface mb-2 tracking-tight">
                سنجش زنده متابولیسم بدنی و انرژی مصرفی
              </h2>

              <p className="text-sm sm:text-base text-on-surface-variant mb-6 leading-relaxed">
                بر اساس معادله معتبر میفلین سن‌ژور (Mifflin-St Jeor). مشخصات خود را وارد کنید تا نرخ سوخت‌وساز و سطح کالری دریافتی روزانه‌تان بلادرنگ محاسبه شود.
              </p>

              <form
                id="calc-form"
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4 sm:space-y-5"
              >
                {/* Gender Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-on-surface mb-2">
                    جنسیت فیزیولوژیک:
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        gender === "male"
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-transparent hover:bg-surface-container"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={gender === "male"}
                        onChange={() => setGender("male")}
                        className="sr-only"
                      />
                      <ClinicalIcon name="male" size={18} />
                      <span className="text-xs sm:text-sm font-bold">آقا (مرد)</span>
                    </label>

                    <label
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        gender === "female"
                          ? "bg-primary text-on-primary border-primary shadow-sm"
                          : "bg-surface-container-low text-on-surface border-transparent hover:bg-surface-container"
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={gender === "female"}
                        onChange={() => setGender("female")}
                        className="sr-only"
                      />
                      <ClinicalIcon name="female" size={18} />
                      <span className="text-xs sm:text-sm font-bold">خانم (زن)</span>
                    </label>
                  </div>
                </div>

                {/* Age, Height, Weight Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label
                      htmlFor="calc-age"
                      className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                    >
                      سن (سال):
                    </label>
                    <input
                      id="calc-age"
                      type="number"
                      min={12}
                      max={99}
                      value={age || ""}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="calc-height"
                      className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                    >
                      قد (سانتی‌متر):
                    </label>
                    <input
                      id="calc-height"
                      type="number"
                      min={100}
                      max={220}
                      value={height || ""}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="calc-weight"
                      className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                    >
                      وزن (کیلوگرم):
                    </label>
                    <input
                      id="calc-weight"
                      type="number"
                      min={30}
                      max={200}
                      value={weight || ""}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full bg-surface-container-low rounded-xl px-3.5 py-2 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30"
                    />
                  </div>
                </div>

                {/* Activity Multiplier */}
                <div>
                  <label
                    htmlFor="calc-activity"
                    className="block text-xs sm:text-sm font-bold text-on-surface mb-1.5"
                  >
                    سطح فعالیت روزانه:
                  </label>
                  <select
                    id="calc-activity"
                    value={activity}
                    onChange={(e) => setActivity(Number(e.target.value))}
                    className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-on-surface text-sm focus:outline-none focus:bg-surface-container focus:ring-2 focus:ring-primary/20 transition-colors border border-outline-variant/30 cursor-pointer"
                  >
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>
          </div>

          {/* Column 2: Interactive Live Results Display */}
          <div className="lg:col-span-5 bg-gradient-to-br from-primary-container to-primary text-on-primary rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col justify-between text-start relative">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg sm:text-xl font-extrabold text-on-primary">
                  خروجی فیزیولوژیک زنده
                </span>
                <span className="bg-surface-container-lowest/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-on-primary">
                  معتبرسازی بالینی
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {/* BMR Box */}
                <div className="bg-surface-container-lowest/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                  <div className="text-xs sm:text-sm text-on-primary/80 font-medium">
                    کالری پایه متابولیک (BMR):
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      id="bmr-output"
                      className="text-2xl sm:text-3xl font-extrabold text-on-primary tracking-tight"
                    >
                      {formatPersianNumber(bmr)}
                    </span>
                    <span className="text-xs text-on-primary/80">
                      کیلوکالری در حالت استراحت مطلق
                    </span>
                  </div>
                </div>

                {/* TDEE Box */}
                <div className="bg-surface-container-lowest/15 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                  <div className="text-xs sm:text-sm text-secondary-fixed font-bold">
                    کل انرژی مصرفی روزانه (TDEE):
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      id="tdee-output"
                      className="text-2xl sm:text-3xl font-extrabold text-secondary-fixed tracking-tight"
                    >
                      {formatPersianNumber(tdee)}
                    </span>
                    <span className="text-xs text-on-primary/80">
                      کیلوکالری کل جهت حفظ وزن
                    </span>
                  </div>
                </div>

                {/* BMI Box */}
                <div className="bg-surface-container-lowest/10 backdrop-blur-xs p-4 rounded-xl border border-white/10">
                  <div className="text-xs sm:text-sm text-on-primary/80 font-medium">
                    شاخص توده بدنی (BMI):
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <div className="flex items-baseline gap-2">
                      <span
                        id="bmi-output"
                        className="text-2xl sm:text-3xl font-extrabold text-on-primary tracking-tight"
                      >
                        {formatPersianNumber(bmiResult.bmi, { decimals: 1 })}
                      </span>
                      <span
                        id="bmi-label"
                        className="text-xs font-bold text-on-primary bg-surface-container-lowest/20 px-2.5 py-0.5 rounded-full"
                      >
                        {bmiResult.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct CTA link to Iranian food diary */}
            <Link
              href={targetDiaryHref}
              className="w-full bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-center font-bold text-sm sm:text-base shadow-md hover:shadow-lg mt-4 cursor-pointer"
            >
              <ClinicalIcon name="restaurant" size={20} className="shrink-0" />
              <span>ورود به دفترچه تغذیه با سفره ایرانی (کفگیر، پیاله، پرس)</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
