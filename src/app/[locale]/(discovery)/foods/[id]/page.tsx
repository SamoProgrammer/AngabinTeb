import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getFoodDetail } from "@/contexts/nutrition/queries";
import { LogFood } from "@/components/nutrition/log-food";
import { toPersianDigits } from "@/lib/metabolism";
import { Stethoscope, UtensilsCrossed } from "lucide-react";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const food = await getFoodDetail(id, locale);
  if (!food) notFound();

  // Find primary macros from nutrient table
  const energyNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-energy" || n.name.includes("کالری") || n.name.includes("Energy")
  );
  const proteinNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-protein" || n.name.includes("پروتئین") || n.name.includes("Protein")
  );
  const carbsNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-carbs" || n.name.includes("کربوهیدرات") || n.name.includes("Carbs")
  );
  const fatNutrient = food.nutrients.find(
    (n) => n.nutrientId === "n-fat" || n.name.includes("چربی") || n.name.includes("Fat")
  );

  const t = await getTranslations("nutrition");
  const fmt = (v: string | number) => (locale === "en" ? String(v) : toPersianDigits(v));
  const componentsCount = (count: number) =>
    t("foodDetailComponentsCount", { count: locale === "en" ? String(count) : toPersianDigits(count) });

  return (
    <div className="flex flex-col gap-8 text-start" dir={locale === "en" ? "ltr" : "rtl"}>
      {/* 1. Breadcrumb (Screen #17) */}
      <nav aria-label={t("foodDetailBreadcrumbFoods")} className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href={`/${locale}`} className="hover:text-primary transition-colors">
          {t("foodDetailBreadcrumbHome")}
        </Link>
        <span>/</span>
        <Link href={`/${locale}/foods`} className="hover:text-primary transition-colors">
          {t("foodDetailBreadcrumbFoods")}
        </Link>
        <span>/</span>
        <span className="text-primary font-bold">{food.name}</span>
      </nav>

      {/* 2. Hero & Identity Section (Screen #17) */}
      <section className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 md:p-10 shadow-xs border border-outline-variant/30">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Icon / Header (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 bg-surface-container-low rounded-3xl border border-outline-variant/20 text-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-xs mb-4">
              <UtensilsCrossed size={48} aria-hidden="true" />
            </div>
            <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-2">
              {food.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
              {food.name}
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              {t("foodDetailHeroSubtitle")}
            </p>
          </div>

          {/* Core Info & Macro Bars (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Serving Units Strip */}
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-on-surface mb-2">
                {t("foodDetailServingsTitle")}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {food.servingUnits.map((su) => (
                  <div
                    key={su.id}
                    className="bg-surface-container-low p-3 rounded-2xl border border-outline-variant/20 flex flex-col text-center"
                  >
                    <span className="font-bold text-xs sm:text-sm text-on-surface">
                      {su.name}
                    </span>
                    <span className="text-[11px] text-primary font-semibold mt-0.5">
                      {fmt(su.gramsEquivalent)} {t("foodDetailGramsSuffix")}
                    </span>
                  </div>
                ))}
                {food.servingUnits.length === 0 && (
                  <p className="text-xs text-on-surface-variant col-span-full">
                    {t("foodDetailNoServings")}
                  </p>
                )}
              </div>
            </div>

            {/* Macro Highlights per 100g */}
            <div className="bg-surface-container-low/60 p-4 rounded-2xl border border-outline-variant/20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-on-surface">
                  {t("foodDetailMacroTitle")}
                </span>
                <span className="text-xs font-bold text-primary">
                  {fmt(energyNutrient?.amountPer100g ?? "—")}{" "}
                  {energyNutrient?.unit ?? "kcal"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
                  <span className="text-on-surface-variant block">{t("foodDetailProteinLabel")}</span>
                  <span className="font-bold text-primary block mt-0.5">
                    {fmt(proteinNutrient?.amountPer100g ?? "—")}{" "}
                    {proteinNutrient?.unit ?? "g"}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
                  <span className="text-on-surface-variant block">{t("foodDetailCarbsLabel")}</span>
                  <span className="font-bold text-secondary block mt-0.5">
                    {fmt(carbsNutrient?.amountPer100g ?? "—")}{" "}
                    {carbsNutrient?.unit ?? "g"}
                  </span>
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/30">
                  <span className="text-on-surface-variant block">{t("foodDetailFatLabel")}</span>
                  <span className="font-bold text-tertiary block mt-0.5">
                    {fmt(fatNutrient?.amountPer100g ?? "—")}{" "}
                    {fatNutrient?.unit ?? "g"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive Nutrient Table & Quick Logger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Full Nutrients Table (7 cols) */}
        <section
          aria-label={t("foodDetailTableAria")}
          className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">
                {t("foodDetailTableTitle")}
              </h2>
              <p className="text-xs text-on-surface-variant">{t("foodDetailTableSubtitle")}</p>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">
              {componentsCount(food.nutrients.length)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold">
                  <th className="py-2.5 px-2">{t("foodDetailColNutrient")}</th>
                  <th className="py-2.5 px-2">{t("foodDetailColUnit")}</th>
                  <th className="py-2.5 px-2">{t("foodDetailColAmount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {food.nutrients.map((n) => (
                  <tr key={n.nutrientId} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-2.5 px-2 font-semibold text-on-surface">{n.name}</td>
                    <td className="py-2.5 px-2 text-on-surface-variant">{n.unit}</td>
                    <td className="py-2.5 px-2 font-bold text-primary font-data-metric">
                      {fmt(n.amountPer100g)}
                    </td>
                  </tr>
                ))}
                {food.nutrients.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-xs text-on-surface-variant">
                      {t("foodDetailNoNutrients")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Doctor's Clinical Advice Card (Screen #17) */}
          <div className="mt-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/20 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Stethoscope size={22} aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs text-on-surface">
                {t("foodDetailDoctorAdviceTitle")}
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-0.5">
                {t("foodDetailDoctorAdviceText")}
              </p>
            </div>
          </div>
        </section>

        {/* Embedded LogFood Section (5 cols) */}
        <section aria-label={t("foodDetailLogSectionAria")} className="lg:col-span-5">
          <LogFood
            locale={locale}
            foods={[
              {
                id: food.id,
                name: food.name,
                servingUnits: food.servingUnits.map((su) => ({
                  id: su.id,
                  name: su.name,
                })),
              },
            ]}
          />
        </section>
      </div>

    </div>
  );
}