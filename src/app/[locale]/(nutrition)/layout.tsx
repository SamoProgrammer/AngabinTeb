import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/contexts/identity/actions";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";
import { Lock, UserCheck } from "lucide-react";

export default async function NutritionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await requireUser();
  const { locale } = await params;
  const t = await getTranslations("nutrition");

  return (
    <div className="w-full bg-surface min-h-screen text-on-surface" dir={locale === "en" ? "ltr" : "rtl"}>
      {/* Top Clinical Philosophy & Medical Banner */}
      <section
        aria-label={t("layoutSectionAria")}
        className="bg-gradient-to-r from-primary-container/10 via-surface-container-low to-secondary-container/10 border-b border-outline-variant/30 py-4 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <UserCheck size={24} aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-on-surface">
                  {t("layoutTitle")}
                </span>
                <span className="bg-primary/10 text-primary font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                  {t("layoutBadge")}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t("layoutSubtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-xl shadow-2xs border border-outline-variant/30">
            <Lock size={16} className="text-primary" aria-hidden="true" />
            <span className="font-medium">{t("layoutConfidential")}</span>
          </div>
        </div>
      </section>

      {/* Main Nutrition Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <NutritionNav locale={locale} />
        {children}
      </div>
    </div>
  );
}