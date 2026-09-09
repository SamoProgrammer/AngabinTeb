import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { searchFoods } from "@/contexts/nutrition/queries";
import { toPersianDigits } from "@/lib/metabolism";
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  SearchX,
  UtensilsCrossed,
} from "lucide-react";

const pageSize = 20;

function pageHref(locale: string, q: string, category: string, p: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  params.set("page", String(p));
  return `/${locale}/foods?${params.toString()}`;
}

export default async function FoodsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q = "", category = "", page } = await searchParams;
  const p = Number(page ?? 1);
  const current = Number.isFinite(p) ? Math.max(1, p) : 1;

  const categories = await db
    .select({ category: foods.category })
    .from(foods)
    .groupBy(foods.category)
    .orderBy(foods.category);

  const { rows, total } = await searchFoods(locale, q.trim(), category, current);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const t = await getTranslations("nutrition");
  const PrevIcon = locale === "en" ? ChevronLeft : ChevronRight;
  const NextIcon = locale === "en" ? ChevronRight : ChevronLeft;
  const resultsCount = (rCount: number, tCount: number) =>
    t("foodsResultsCount", {
      rCount: locale === "en" ? String(rCount) : toPersianDigits(rCount),
      tCount: locale === "en" ? String(tCount) : toPersianDigits(tCount),
    });
  const pageOf = (curr: number, pages: number) =>
    t("foodsPageOf", {
      curr: locale === "en" ? String(curr) : toPersianDigits(curr),
      pages: locale === "en" ? String(pages) : toPersianDigits(pages),
    });

  return (
    <div className="flex flex-col gap-8 text-start" dir={locale === "en" ? "ltr" : "rtl"}>
      {/* 1. Top Search & Hero Section (Screen #36) */}
      <section
        aria-label={t("foodsHeroAria")}
        className="bg-surface-container-low rounded-3xl p-6 sm:p-8 md:p-10 border border-outline-variant/30 flex flex-col gap-5"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {t("foodsHeroTitle")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5 leading-relaxed">
            {t("foodsHeroDesc")}
          </p>
        </div>

        {/* Search & Filter Form */}
        <form
          method="GET"
          className="bg-surface-container-lowest p-2 sm:p-3 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col md:flex-row items-center gap-2"
        >
          <div className="flex items-center gap-2 w-full px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <Search size={22} className="text-primary" aria-hidden="true" />
            <input
              name="q"
              defaultValue={q}
              aria-label="Search foods"
              placeholder={t("foodsSearchPlaceholder")}
              className="w-full bg-transparent text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              name="category"
              defaultValue={category}
              className="w-full md:w-48 bg-surface-container-low text-on-surface text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 border border-outline-variant/20 focus:outline-none"
            >
              <option value="">{t("foodsAllCategories")}</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <Search size={18} aria-hidden="true" />
              <span>{t("foodsSearchBtn")}</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. Results (Screen #36) */}
      <main className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">
              {t("foodsResultsTitle")}
            </h2>
            <span className="text-xs text-on-surface-variant">
              {resultsCount(rows.length, total)}
            </span>
          </div>

          {/* Cards Grid */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rows.map((f) => (
              <li
                key={f.id}
                className="bg-surface-container-lowest rounded-3xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-surface-container text-on-surface-variant text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {f.category}
                    </span>
                    <UtensilsCrossed size={18} className="text-primary/70" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-on-surface">
                    {f.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                  <Link
                    href={`/${locale}/foods/${f.id}`}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Info size={16} aria-hidden="true" />
                    <span>{t("foodsViewDetails")}</span>
                  </Link>
                </div>
              </li>
            ))}

            {rows.length === 0 && (
              <li className="col-span-full bg-surface-container-lowest rounded-3xl p-10 text-center border border-dashed border-outline-variant/40">
                <SearchX size={36} className="text-on-surface-variant/40 mb-2" aria-hidden="true" />
                <p className="text-sm font-bold text-on-surface">
                  {t("foodsEmptyTitle")}
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {t("foodsEmptyHint")}
                </p>
              </li>
            )}
          </ul>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <nav
              aria-label={t("foodsPaginationAria")}
              className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between gap-2"
            >
              {current > 1 ? (
                <Link
                  href={pageHref(locale, q, category, current - 1)}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
                >
                  <PrevIcon size={16} aria-hidden="true" />
                  <span>{t("foodsPrevPage")}</span>
                </Link>
              ) : (
                <div />
              )}

              <span className="text-xs font-semibold text-on-surface-variant">
                {pageOf(current, totalPages)}
              </span>

              {current < totalPages ? (
                <Link
                  href={pageHref(locale, q, category, current + 1)}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
                >
                  <span>{t("foodsNextPage")}</span>
                  <NextIcon size={16} aria-hidden="true" />
                </Link>
              ) : (
                <div />
              )}
            </nav>
          )}
        </main>
    </div>
  );
}