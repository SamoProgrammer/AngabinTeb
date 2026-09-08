import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listTopics } from "@/contexts/content/queries";
import {
  Activity,
  Apple,
  ArrowLeft,
  ArrowRight,
  Bone,
  BrainCircuit,
  Droplets,
  HeartHandshake,
  HeartPulse,
  Search,
  ShieldPlus,
  Weight,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";

// Mapping topic slugs to clinical icons
function getTopicIcon(slug: string): LucideIcon {
  switch (slug) {
    case "diabetes":
    case "metabolism":
      return Activity;
    case "cardiology":
    case "cardiovascular":
    case "heart":
      return HeartPulse;
    case "gastro":
    case "gi-disease":
    case "liver":
      return Apple;
    case "weight":
    case "obesity":
      return Weight;
    case "fitness":
      return Activity;
    case "neurology":
    case "neuropsychiatric":
      return BrainCircuit;
    case "women-health":
    case "life-stages":
      return HeartHandshake;
    case "pulmonary":
      return Wind;
    case "rheumatology":
      return Bone;
    case "anemia":
      return Droplets;
    default:
      return ShieldPlus;
  }
}

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("topics");
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: number | string) =>
    locale === "fa" ? toPersianDigits(n) : String(n);
  const FwdIcon = dir === "ltr" ? ArrowRight : ArrowLeft;

  const topics = await listTopics(locale);

  return (
    <div dir={dir} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header Hero */}
        <div className="flex flex-col gap-2 text-start max-w-3xl">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Clinical Topics Grid (Screen #2) */}
        <section aria-label={t("listAria")} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => {
            const TopicIcon = getTopicIcon(topic.slug);
            return (
              <Link
                key={topic.id}
                href={`/${locale}/topics/${topic.slug}`}
                className="group bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs hover:shadow-tier-2 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between text-start"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TopicIcon size={30} aria-hidden="true" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {topic.name}
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t("cardDesc", { name: topic.name })}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                  <span>{t("countArticles", { count: fmt(topic.count) })}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                    <span>{t("viewTopic")}</span>
                    <FwdIcon size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}

          {topics.length === 0 && (
            <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container-low rounded-2xl">
              <p>{t("noTopics")}</p>
            </div>
          )}
        </section>

        {/* Quick Diagnostic / Services Promo Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-6 sm:p-8 rounded-2xl shadow-tier-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-start">
          <div className="flex flex-col gap-2 max-w-xl">
            <h3 className="text-lg sm:text-xl font-bold">{t("promoTitle")}</h3>
            <p className="text-xs sm:text-sm text-on-primary/90 leading-relaxed">
              {t("promoDesc")}
            </p>
          </div>
          <Link
            href={`/${locale}/doctors`}
            className="inline-flex items-center gap-2 bg-on-primary text-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:bg-surface-container-lowest transition-all shrink-0"
          >
            <Search size={18} aria-hidden="true" />
            <span>{t("promoBtn")}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
