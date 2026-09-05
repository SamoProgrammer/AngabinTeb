import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listDoctors } from "@/contexts/catalog/queries";
import { DoctorCard, type DoctorData, toPersianDigits } from "@/components/catalog/doctor-card";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { EmptyState, ErrorState } from "@/components/clinical/empty-state";
import faMessages from "../../../../../messages/fa.json";

const faDoctors = faMessages.doctors as Record<string, string>;

const pageSize = 12;

function pageHref(
  locale: string,
  specialty: string,
  city: string,
  q: string,
  p: number,
) {
  const params = new URLSearchParams();
  if (specialty) params.set("specialty", specialty);
  if (city) params.set("city", city);
  if (q) params.set("q", q);
  params.set("page", String(p));
  return `/${locale}/doctors?${params.toString()}`;
}

const SPECIALTIES = [
  { id: "all", labelKey: "specialtyAll", slug: "" },
  { id: "nutrition", labelKey: "specialtyNutrition", slug: "nutrition" },
  { id: "gastroenterology", labelKey: "specialtyGastroenterology", slug: "gastroenterology" },
  { id: "cardiology", labelKey: "specialtyCardiology", slug: "cardiology" },
  { id: "endocrinology", labelKey: "specialtyEndocrinology", slug: "endocrinology" },
  { id: "gynecology", labelKey: "specialtyGynecology", slug: "gynecology" },
];

export default async function DoctorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ specialty?: string; city?: string; q?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { specialty, city, q, page } = await searchParams;
  const p = Number(page ?? 1);
  const current = Number.isFinite(p) ? Math.max(1, p) : 1;
  const isEn = locale === "en";
  const dir = isEn ? "ltr" : "rtl";
  const fmt = (n: number | string) => (isEn ? String(n) : toPersianDigits(n));

  let t: (key: string, values?: Record<string, string | number>) => string = (
    key,
    values,
  ) => {
    let out: string = faDoctors[key] ?? key;
    if (values) {
      for (const [k, v] of Object.entries(values)) out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
  };
  try {
    const intlT = await getTranslations("doctors");
    t = (key, values) => intlT(key, values);
  } catch {
    // fallback in environments without next-intl server context
  }

  let dbDoctors: DoctorData[] = [];
  let total = 0;
  let loadError = false;
  try {
    const res = await listDoctors(locale, specialty, city, current, pageSize);
    total = res.total;
    dbDoctors = res.rows.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty ?? t("fallbackSpecialty"),
      cityId: d.cityId,
      imageUrl: d.imageUrl,
      slug: d.id,
      isVerified: false,
    }));
  } catch {
    loadError = true;
  }

  // Filter by query if provided
  let allDoctors = dbDoctors;
  if (q && q.trim()) {
    const queryStr = q.trim().toLowerCase();
    allDoctors = allDoctors.filter(
      (d) =>
        d.name.toLowerCase().includes(queryStr) ||
        (d.specialty && d.specialty.toLowerCase().includes(queryStr)),
    );
  }

  const totalCount = q?.trim() ? allDoctors.length : total;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeFrom = totalCount === 0 ? 0 : (current - 1) * pageSize + 1;
  const rangeTo = totalCount === 0 ? 0 : Math.min(totalCount, rangeFrom + allDoctors.length - 1);
  const currentSpecialty = specialty ?? "";

  return (
    <main className="w-full bg-surface" dir={dir}>
      {/* Top Clinical Hero Bar */}
      <div className="w-full bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {t("heroTitle")}
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant">
                {t("heroSubtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-xl w-fit">
              <ClinicalIcon name="verified" size={20} className="text-primary shrink-0" />
              <span className="text-sm font-medium">{t("heroBadge")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Pills Carousel Filter */}
      <div className="sticky top-20 z-40 bg-surface/95 backdrop-blur-md shadow-xs border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SPECIALTIES.map((item) => {
              const isActive =
                item.slug === currentSpecialty ||
                (!currentSpecialty && item.id === "all");
              return (
                <Link
                  key={item.id}
                  href={
                    item.slug
                      ? `/${locale}/doctors?specialty=${encodeURIComponent(item.slug)}`
                      : `/${locale}/doctors`
                  }
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar + Doctors Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Filtering Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            {/* Doctor/Specialty Search Input */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30">
              <form action={`/${locale}/doctors`} method="GET" className="flex flex-col gap-3">
                <label
                  htmlFor="doctor-search-input"
                  className="text-sm font-bold text-on-surface"
                >
                  {t("searchLabel")}
                </label>
                <div className="relative w-full">
                  <input
                    id="doctor-search-input"
                    name="q"
                    defaultValue={q ?? ""}
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    className="w-full bg-surface-container-low text-on-surface text-sm py-2.5 pe-4 ps-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
                  />
                  <div className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                    <ClinicalIcon name="search" size={20} />
                  </div>
                </div>
                {specialty && (
                  <input type="hidden" name="specialty" value={specialty} />
                )}
                {city && <input type="hidden" name="city" value={city} />}
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-container text-on-primary text-xs font-medium py-2 px-4 rounded-xl transition-colors self-end"
                >
                  {t("searchSubmit")}
                </button>
              </form>
            </div>

            {/* Filter options card */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface">{t("filtersTitle")}</span>
                <Link
                  href={`/${locale}/doctors`}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  {t("clearFilters")}
                </Link>
              </div>

              {/* City Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-on-surface">{t("cityLabel")}</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href={`/${locale}/doctors?city=tehran${specialty ? `&specialty=${specialty}` : ""}`}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors ${
                      city === "tehran" || !city
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span>{t("cityTehran")}</span>
                  </Link>
                  <Link
                    href={`/${locale}/doctors?city=other${specialty ? `&specialty=${specialty}` : ""}`}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors ${
                      city === "other"
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span>{t("cityOther")}</span>
                  </Link>
                </div>
              </div>

              {/* Admission Capacity Checkbox */}
              <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                <span className="text-xs font-bold text-on-surface">{t("timeLabel")}</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                  <span>{t("availableOnly")}</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Main List Section (8 Cols) */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            {/* Sort & Count Header Strip */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClinicalIcon name="sort" size={20} className="text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-on-surface">{t("sortLabel")}</span>
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl text-xs">
                  <span className="px-3 py-1 rounded-lg bg-surface-container-lowest text-primary shadow-xs font-bold">
                    {t("sortSoonest")}
                  </span>
                  <span className="px-3 py-1 text-on-surface-variant hover:text-on-surface">
                    {t("sortTopRated")}
                  </span>
                </div>
              </div>

              <span className="text-xs text-on-surface-variant">
                {t("showingRange", {
                  from: fmt(rangeFrom),
                  count: fmt(rangeTo),
                  total: fmt(totalCount),
                })}
              </span>
            </div>

            {/* Doctors Cards Grid */}
            {loadError ? (
              <ErrorState
                title={t("errorTitle")}
                hint={t("errorHint")}
              />
            ) : allDoctors.length === 0 ? (
              <EmptyState
                title={t("emptyTitle")}
                hint={t("emptyHint")}
                actionHref={`/${locale}/doctors`}
                actionLabel={t("clearFilters")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allDoctors.map((doc) => (
                  <DoctorCard
                    key={doc.id}
                    doctor={doc}
                    locale={locale}
                    href={`/${locale}/doctors/${doc.slug || doc.id}`}
                  />
                ))}
              </div>
            )}

            {/* Pagination Navigation */}
            {!loadError && totalPages > 1 && (
              <nav
                aria-label={t("pageOf", { current, pages: totalPages })}
                className="bg-surface-container-lowest p-4 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex items-center justify-between gap-2"
              >
                {current > 1 ? (
                  <Link
                    href={pageHref(locale, specialty ?? "", city ?? "", q ?? "", current - 1)}
                    className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
                  >
                    <ClinicalIcon name="chevron_right" size={16} />
                    <span>{t("pagePrev")}</span>
                  </Link>
                ) : (
                  <div />
                )}

                <span className="text-xs font-semibold text-on-surface-variant">
                  {t("pageOf", {
                    current: fmt(current),
                    pages: fmt(totalPages),
                  })}
                </span>

                {current < totalPages ? (
                  <Link
                    href={pageHref(locale, specialty ?? "", city ?? "", q ?? "", current + 1)}
                    className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
                  >
                    <span>{t("pageNext")}</span>
                    <ClinicalIcon name="chevron_left" size={16} />
                  </Link>
                ) : (
                  <div />
                )}
              </nav>
            )}

            {/* Triage Hotline Support Banner */}
            <div className="mt-4 p-6 rounded-2xl bg-gradient-to-l from-primary/10 via-surface-container to-surface-container-lowest border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary text-on-primary shrink-0 shadow-sm">
                  <ClinicalIcon name="support_agent" size={32} />
                </div>
                <div className="flex flex-col gap-1 text-start">
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">
                    {t("triageTitle")}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {t("triageDesc")}
                  </p>
                </div>
              </div>
              <a
                href="tel:02188224000"
                className="shrink-0 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs sm:text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <ClinicalIcon name="phone_in_talk" size={18} />
                <span>{t("triageCta")}</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}