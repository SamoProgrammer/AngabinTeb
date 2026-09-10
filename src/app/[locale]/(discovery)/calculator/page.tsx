import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { UserRoundPlus } from "lucide-react";
import { MetabolismCalculator } from "@/components/clinical/metabolism-calculator";

export default async function CalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("calculator");
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <div className="flex flex-col gap-6 text-start" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm sm:text-base text-on-surface-variant mt-1">
          {t("subtitle")}
        </p>
      </div>

      <MetabolismCalculator locale={locale} diaryHref={`/${locale}/signin`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12">
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-xs border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm sm:text-base text-on-surface-variant font-medium">
            {t("signupNote")}
          </p>
          <Link
            href={`/${locale}/signin`}
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary py-3 px-8 rounded-xl font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all shrink-0"
          >
            <UserRoundPlus size={20} aria-hidden="true" />
            <span>{t("signupCta")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
