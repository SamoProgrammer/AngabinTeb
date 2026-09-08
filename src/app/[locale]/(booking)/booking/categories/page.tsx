import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CLINICAL_SPECIALTIES } from "@/lib/clinical-specialties";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  LayoutGrid,
  Search,
  SearchX,
  UserCheck,
} from "lucide-react";
import { resolveIcon } from "@/components/clinical/icons";
import { toPersianDigits } from "@/lib/format";

export default async function BookingCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations("booking");
  const tCommon = await getTranslations("common");
  const dir = locale === "en" ? "ltr" : "rtl";
  const ForwardArrow = locale === "en" ? ArrowRight : ArrowLeft;
  const fmt = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  const query = (q ?? "").trim().toLowerCase();

  const filteredSpecialties = CLINICAL_SPECIALTIES.filter((s) => {
    if (!query) return true;
    return (
      s.nameFa.toLowerCase().includes(query) ||
      s.nameEn.toLowerCase().includes(query) ||
      s.nameAr.toLowerCase().includes(query) ||
      s.descFa.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen" dir={dir}>
      {/* Breadcrumbs */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              {t("crumbHome")}
            </Link>
            <span className="opacity-40">/</span>
            <Link href={`/${locale}/booking/doctors`} className="hover:text-primary transition-colors">
              {t("crumbBooking")}
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-on-surface font-bold">
              {t("categories.title")}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <BadgeCheck size={16} aria-hidden="true" />
            {t("categories.badge")}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 via-surface to-surface py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
            {t("categories.heroTitle")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-8">
            {t("categories.heroDesc")}
          </p>

          {/* Search Bar */}
          <form
            method="GET"
            className="max-w-lg mx-auto relative flex items-center bg-surface-container-lowest rounded-2xl shadow-tier-2 border border-outline-variant/40 p-2"
          >
            <Search
              size={22}
              className="text-on-surface-variant ms-3 shrink-0"
              aria-hidden="true"
            />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder={t("categories.searchPh")}
              className="w-full bg-transparent px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
            />
            {q && (
              <Link
                href={`/${locale}/booking/categories`}
                className="text-xs text-on-surface-variant hover:text-error px-2 py-1"
              >
                {t("clearSearch")}
              </Link>
            )}
            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              {tCommon("search")}
            </button>
          </form>
        </div>
      </section>

      {/* Specialties Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
            <LayoutGrid size={22} className="text-primary" aria-hidden="true" />
            <span>
              {t("categories.listTitle")}
            </span>
            <span className="text-xs bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full font-bold">
              {t("categories.count", { count: fmt(filteredSpecialties.length) })}
            </span>
          </h2>
        </div>

        {filteredSpecialties.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-10 text-center border border-outline-variant/30">
            <SearchX size={48} className="text-on-surface-variant/40 mx-auto mb-3" aria-hidden="true" />
            <p className="text-base font-bold text-on-surface mb-1">
              {t("categories.emptyTitle")}
            </p>
            <p className="text-xs text-on-surface-variant mb-4">
              {t("categories.emptyHint")}
            </p>
            <Link
              href={`/${locale}/booking/categories`}
              className="text-primary text-xs font-bold hover:underline"
            >
              {t("categories.viewAll")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredSpecialties.map((specialty) => {
              const SpecialtyIcon = resolveIcon(specialty.icon);
              const name =
                locale === "en"
                  ? specialty.nameEn
                  : locale === "ar"
                    ? specialty.nameAr
                    : specialty.nameFa;
              const subName = locale === "en" ? specialty.nameFa : specialty.nameEn;
              const desc =
                locale === "en"
                  ? specialty.descEn
                  : locale === "ar"
                    ? specialty.descAr
                    : specialty.descFa;

              return (
                <Link
                  key={specialty.id}
                  href={`/${locale}/booking/doctors?specialty=${specialty.slug}`}
                  className="group flex flex-col justify-between bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 hover:-translate-y-1 text-start border border-outline-variant/30"
                >
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-13 h-13 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shrink-0">
                        <SpecialtyIcon size={28} aria-hidden="true" />
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-on-surface mb-0.5 group-hover:text-primary transition-colors">
                      {name}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant/70 font-mono mb-2">
                      {subName}
                    </p>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 flex items-center justify-between text-primary text-xs font-bold border-t border-outline-variant/15">
                    <span>{t("categories.selectDoctor")}</span>
                    <ForwardArrow
                      size={18}
                      className="group-hover:translate-x-[-3px] transition-transform"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserCheck size={28} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-on-surface">
                {t("categories.trustTitle")}
              </h4>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t("categories.trustDesc")}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/booking/doctors`}
            className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-6 py-3 rounded-xl transition-colors shrink-0 shadow-sm"
          >
            {t("categories.viewDoctors")}
          </Link>
        </div>
      </section>
    </div>
  );
}
