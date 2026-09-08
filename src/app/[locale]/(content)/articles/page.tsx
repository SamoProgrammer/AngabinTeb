import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listContent, listTopics } from "@/contexts/content/queries";
import { ArticleCard } from "@/components/clinical/media-cards";
import { ArrowLeft, ArrowRight, SearchX } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

const pageSize = 12;

function pageHref(locale: string, page: number, topic?: string, q?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (topic) params.set("topic", topic);
  if (q) params.set("q", q);
  return `/${locale}/articles?${params.toString()}`;
}

function topicHref(locale: string, topicSlug?: string, q?: string) {
  const params = new URLSearchParams();
  if (topicSlug) params.set("topic", topicSlug);
  if (q) params.set("q", q);
  const qs = params.toString();
  return `/${locale}/articles${qs ? `?${qs}` : ""}`;
}

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; topic?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { page, topic: topicSlug, q } = await searchParams;
  const p = Number(page ?? 1);
  const current = Number.isFinite(p) ? Math.max(1, p) : 1;

  const t = await getTranslations("articles");
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: number | string) =>
    locale === "fa" ? toPersianDigits(n) : String(n);
  const FwdIcon = dir === "ltr" ? ArrowRight : ArrowLeft;
  const BackIcon = dir === "ltr" ? ArrowLeft : ArrowRight;

  const topics = await listTopics(locale);
  const selectedTopic = topics.find((topic) => topic.slug === topicSlug);

  const { rows, total } = await listContent(
    "article",
    locale,
    selectedTopic?.id,
    undefined,
    current,
    pageSize,
  );

  // Filter in-memory if query string provided
  const displayRows = q
    ? rows.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()))
    : rows;

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div dir={dir} className="w-full bg-surface min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Title & Intro */}
        <div className="flex flex-col gap-2 text-start">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Clinical Topic Categories Bar (Screen #42) */}
        <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-2xl p-2 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={topicHref(locale, undefined, q)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  !topicSlug
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {t("allArticles")}
              </Link>
              {topics.map((topic) => {
                const isActive = topic.slug === topicSlug;
                return (
                  <Link
                    key={topic.id}
                    href={topicHref(locale, topic.slug, q)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {topic.name}
                  </Link>
                );
              })}
            </div>
            <Link
              href={`/${locale}/topics`}
              className="hidden sm:flex items-center gap-1 text-primary text-xs sm:text-sm font-bold hover:underline shrink-0 pe-2"
            >
              <span>{t("allTopics")}</span>
              <FwdIcon size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Articles Grid */}
        <section aria-label={t("listAria")}>
          {displayRows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRows.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={{
                    id: article.id,
                    slug: article.slug,
                    title: article.title,
                    summary: article.body,
                    publishedAt: article.publishedAt,
                    ...(selectedTopic ? { category: selectedTopic.name } : {}),
                  }}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <SearchX size={48} className="text-outline" aria-hidden="true" />
              <p className="text-base font-bold text-on-surface">{t("emptyTitle")}</p>
              <p className="text-xs text-on-surface-variant">{t("emptyDesc")}</p>
              <Link
                href={`/${locale}/articles`}
                className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                {t("backBtn")}
              </Link>
            </div>
          )}
        </section>

        {/* Pagination Bar */}
        {pages > 1 && (
          <nav aria-label={t("paginationAria")} className="flex items-center justify-center gap-2 pt-6">
            {current > 1 && (
              <Link
                href={pageHref(locale, current - 1, topicSlug, q)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs sm:text-sm font-medium flex items-center gap-1"
              >
                <BackIcon size={16} aria-hidden="true" />
                <span>{t("prev")}</span>
              </Link>
            )}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-on-surface-variant px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <span>{t("page")}</span>
              <span className="font-bold text-primary">{fmt(current)}</span>
              <span>{t("of")}</span>
              <span className="font-bold">{fmt(pages)}</span>
            </div>
            {current < pages && (
              <Link
                href={pageHref(locale, current + 1, topicSlug, q)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs sm:text-sm font-medium flex items-center gap-1"
              >
                <span>{t("next")}</span>
                <FwdIcon size={16} aria-hidden="true" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
