import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, BadgeCheck } from "lucide-react";
import { listTopics } from "@/contexts/content/queries";
import { resolveIcon } from "@/components/clinical/icons";
import { toPersianDigits } from "@/lib/format";

// Topic slug → canonical icon name (resolved via resolveIcon, CircleHelp fallback).
function topicIconName(slug: string): string {
  switch (slug) {
    case "diabetes":
      return "vital_signs";
    case "cardiovascular":
      return "cardiology";
    case "gi-disease":
      return "nutrition";
    case "fitness":
      return "fitness_center";
    case "pulmonary":
      return "respiratory_rate";
    case "rheumatology":
      return "skeleton";
    case "thyroid":
      return "biotech";
    case "anemia":
      return "bloodtype";
    case "cancer":
      return "shield";
    case "neuropsychiatric":
      return "psychology";
    case "life-stages":
      return "child_care";
    default:
      return "health_and_safety";
  }
}

export default async function NutritionKnowledgePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("nutritionKnowledge");
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: number | string) =>
    locale === "fa" ? toPersianDigits(n) : String(n);
  const ForwardIcon = dir === "ltr" ? ArrowRight : ArrowLeft;

  // Live clinical topics from the content kernel — counts are real published-article counts.
  const topics = await listTopics(locale);

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen" dir={dir}>
      {/* Breadcrumbs */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              {t("breadcrumbHome")}
            </Link>
            <span className="opacity-40">/</span>
            <Link href={`/${locale}/articles`} className="hover:text-primary transition-colors">
              {t("breadcrumbArticles")}
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-on-surface font-bold">
              {t("breadcrumbHub")}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <BadgeCheck size={16} aria-hidden="true" />
            {t("badge")}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 via-surface to-surface py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
            {t("heroTitle")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-4">
            {t("heroDesc")}
          </p>
        </div>
      </section>

      {/* Topics Grid — live data, each card links to its filtered article list */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {topics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {topics.map((topic) => {
              const CatIcon = resolveIcon(topicIconName(topic.slug));
              return (
              <Link
                key={topic.id}
                href={`/${locale}/articles?topic=${topic.slug}`}
                className="group flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 hover:-translate-y-1 text-start border border-outline-variant/30"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shrink-0">
                      <CatIcon size={26} aria-hidden="true" />
                    </div>
                    <span className="text-xs bg-surface-container-low text-primary px-2.5 py-0.5 rounded-full font-bold">
                      {t("countArticles", { count: fmt(topic.count) })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                    {topic.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between text-primary text-xs font-bold border-t border-outline-variant/15">
                  <span>{t("readBtn")}</span>
                  <ForwardIcon size={16} aria-hidden="true" />
                </div>
              </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-on-surface-variant bg-surface-container-low rounded-2xl">
            <p>{t("heroDesc")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
