import Link from "next/link";
import { listContent, listTopics } from "@/contexts/content/queries";
import { ArticleCard } from "@/components/clinical/media-cards";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits } from "@/components/catalog/doctor-card";

const pageSize = 12;

function pageHref(locale: string, page: number, topic?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (topic) params.set("topic", topic);
  return `/${locale}/articles?${params.toString()}`;
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

  const topics = await listTopics(locale);
  const selectedTopic = topics.find((t) => t.slug === topicSlug);

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
    <div dir="rtl" className="w-full bg-surface min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Title & Intro */}
        <div className="flex flex-col gap-2 text-start">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            مجله سلامت و پژوهش‌های پزشکی
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-3xl leading-relaxed">
            راهنماهای بالینی، پروتکل‌های سبک زندگی و تازه‌ترین پژوهش‌های معتبر علوم پزشکی و تغذیه با نظارت مستقیم پزشکان متخصص انگبین طب.
          </p>
        </div>

        {/* Clinical Topic Categories Bar (Screen #42) */}
        <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-2xl p-2 sm:p-3 shadow-xs">
          <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/${locale}/articles`}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  !topicSlug
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                همه مقالات
              </Link>
              {topics.map((t) => {
                const isActive = t.slug === topicSlug;
                return (
                  <Link
                    key={t.id}
                    href={`/${locale}/articles?topic=${t.slug}`}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
            <Link
              href={`/${locale}/topics`}
              className="hidden sm:flex items-center gap-1 text-primary text-xs sm:text-sm font-bold hover:underline shrink-0 pe-2"
            >
              <span>همه دسته‌بندی‌ها</span>
              <ClinicalIcon name="arrow_back" size={16} />
            </Link>
          </div>
        </div>

        {/* Articles Grid */}
        <section aria-label="فهرست مقالات">
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
              <ClinicalIcon name="search_off" size={48} className="text-outline" />
              <p className="text-base font-bold text-on-surface">مقاله‌ای در این دسته‌بندی یافت نشد</p>
              <p className="text-xs text-on-surface-variant">می‌توانید موضوعات دیگر را بررسی کنید یا همه مقالات را مشاهده فرمایید.</p>
              <Link
                href={`/${locale}/articles`}
                className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                بازگشت به همه مقالات
              </Link>
            </div>
          )}
        </section>

        {/* Pagination Bar */}
        {pages > 1 && (
          <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-2 pt-6">
            {current > 1 && (
              <Link
                href={pageHref(locale, current - 1, topicSlug)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs sm:text-sm font-medium flex items-center gap-1"
              >
                <ClinicalIcon name="arrow_forward" size={16} />
                <span>قبلی</span>
              </Link>
            )}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-on-surface-variant px-3 py-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <span>صفحه</span>
              <span className="font-bold text-primary">{toPersianDigits(current)}</span>
              <span>از</span>
              <span className="font-bold">{toPersianDigits(pages)}</span>
            </div>
            {current < pages && (
              <Link
                href={pageHref(locale, current + 1, topicSlug)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs sm:text-sm font-medium flex items-center gap-1"
              >
                <span>بعدی</span>
                <ClinicalIcon name="arrow_back" size={16} />
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}