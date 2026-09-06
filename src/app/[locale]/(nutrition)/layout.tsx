import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function NutritionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await requireUser();
  const { locale } = await params;

  return (
    <div className="w-full bg-surface min-h-screen text-on-surface" dir="rtl">
      {/* Top Clinical Philosophy & Medical Banner */}
      <section
        aria-label="سامانه پایش بالینی تغذیه و متابولیسم"
        className="bg-gradient-to-r from-primary-container/10 via-surface-container-low to-secondary-container/10 border-b border-outline-variant/30 py-4 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ClinicalIcon name="verified_user" size={24} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-on-surface">
                  سامانه پایش بالینی تغذیه و متابولیسم انگبین طب
                </span>
                <span className="bg-primary/10 text-primary font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                  استانداردهای انجمن غدد و دیابت
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                محاسبه شاخص‌های زیستی، رژیم‌درمانی پزشکی و ثبت وعده‌ها بر اساس مقیاس‌های سنتی سفره ایرانی
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-xl shadow-2xs border border-outline-variant/30">
            <ClinicalIcon name="lock" size={16} className="text-primary" />
            <span className="font-medium">پرونده سلامت محرمانه</span>
          </div>
        </div>
      </section>

      {/* Main Nutrition Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <NutritionNav locale={locale} />
        {children}
      </main>
    </div>
  );
}