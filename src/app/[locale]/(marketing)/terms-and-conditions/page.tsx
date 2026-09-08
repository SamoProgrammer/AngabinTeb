import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, Gavel } from "lucide-react";

interface TermArticle {
  title: string;
  body: string;
}

export default async function TermsAndConditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("terms");
  const terms = t.raw("articles") as TermArticle[];
  const isRtl = locale !== "en";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10 text-start">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("breadcrumbHome")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("breadcrumbTerms")}
          </span>
        </div>

        {/* Header Hero */}
        <section className="bg-gradient-to-b from-primary/10 via-surface to-surface p-6 sm:p-10 rounded-3xl border border-outline-variant/30 text-start">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <Gavel size={32} aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {t("heroTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-2 leading-relaxed">
            {t("heroDesc")}
          </p>
        </section>

        {/* Articles List */}
        <div className="flex flex-col gap-4">
          {terms.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 rounded-3xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-2.5"
            >
              <h2 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
                <BadgeCheck size={18} className="text-primary" aria-hidden="true" />
                <span>{item.title}</span>
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed text-justify">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Acceptance Note */}
        <div className="p-5 bg-surface-container-low rounded-2xl border border-outline-variant/20 text-xs text-on-surface-variant leading-relaxed">
          {t("acceptanceNote")}
        </div>
      </main>
    </div>
  );
}
