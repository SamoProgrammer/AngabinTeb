import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";
import { NutritionNav } from "@/components/nutrition/nutrition-nav";

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
    <div className="w-full bg-surface min-h-screen text-on-surface" dir={locale === "en" ? "ltr" : "rtl"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <NutritionNav locale={locale} />
        {children}
      </div>
    </div>
  );
}