import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listServices } from "@/contexts/catalog/queries";
import { ServiceCard, type ServiceData } from "@/components/catalog/service-card";
import { toPersianDigits } from "@/lib/format";
import {
  AudioWaveform,
  Banknote,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  Droplets,
  Headset,
  Scale,
  Scan,
  Search,
  ShieldPlus,
  TestTube,
  UserCheck,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { EmptyState, ErrorState } from "@/components/clinical/empty-state";

const pageSize = 12;

function pageHref(
  locale: string,
  category: string,
  q: string,
  fasting: string,
  p: number,
) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (fasting) params.set("fasting", fasting);
  params.set("page", String(p));
  return `/${locale}/services?${params.toString()}`;
}

const CATEGORIES: Array<{ id: string; labelKey: string; slug: string; icon?: LucideIcon }> = [
  { id: "all", labelKey: "catAll", slug: "" },
  { id: "lab", labelKey: "catLab", slug: "laboratory", icon: Droplets },
  { id: "imaging", labelKey: "catImaging", slug: "imaging", icon: Scan },
  { id: "inbody", labelKey: "catPhysio", slug: "physiology", icon: Scale },
  { id: "cardio", labelKey: "catCardio", slug: "cardiology", icon: AudioWaveform },
  { id: "nutrition", labelKey: "catNutrition", slug: "nutrition", icon: Utensils },
];

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; city?: string; q?: string; fasting?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { category, city, q, fasting, page } = await searchParams;
  const p = Number(page ?? 1);
  const current = Number.isFinite(p) ? Math.max(1, p) : 1;
  const t = await getTranslations("services");
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  let dbServices: ServiceData[] = [];
  let total = 0;
  let loadError = false;
  try {
    const res = await listServices(locale, category, city, current, pageSize);
    total = res.total;
    dbServices = res.rows.map((s) => ({
      id: s.id,
      name: s.name,
      providerName: s.providerName,
      serviceType: s.serviceType,
      category: s.category,
      durationMinutes: s.durationMinutes,
      price: s.price ? Number(s.price) : null,
      slug: s.id,
    }));
  } catch {
    loadError = true;
  }

  // Filter by search query if present
  let allServices = dbServices;
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    allServices = allServices.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.category && s.category.toLowerCase().includes(term)) ||
        (s.providerName && s.providerName.toLowerCase().includes(term)),
    );
  }

  // Filter by fasting if requested
  if (fasting === "no-fasting") {
    allServices = allServices.filter((s) => !s.fastingHours || s.fastingHours === 0);
  }

  const currentCategory = category ?? "";
  const filtered = q?.trim() || fasting === "no-fasting";
  const totalCount = filtered ? allServices.length : total;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <main className="w-full bg-surface" dir={dir}>
      {/* Top Hero / Clinical Catalog Banner */}
      <section className="relative w-full bg-surface-container-low px-4 sm:px-6 lg:px-8 py-10 overflow-hidden border-b border-outline-variant/20">
        <div className="relative max-w-7xl mx-auto flex flex-col items-start justify-between gap-6">
          <div className="flex flex-col gap-3 max-w-4xl text-start">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
              <UserCheck size={18} aria-hidden="true" />
              <span className="text-xs sm:text-sm font-medium">{t("heroBadge")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-on-surface tracking-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              {t("heroSubtitle")}
            </p>

            {/* Trust Metric Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-on-surface text-xs sm:text-sm">
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs border border-outline-variant/20">
                <Banknote size={18} className="text-primary" aria-hidden="true" />
                <span>{t("pillInPerson")}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs border border-outline-variant/20">
                <ShieldPlus size={18} className="text-secondary" aria-hidden="true" />
                <span>{t("pillInsurance")}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs border border-outline-variant/20">
                <TestTube size={18} className="text-primary" aria-hidden="true" />
                <span>{t("pillEhr")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Category Tabs Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 flex flex-col gap-4">
        {/* Category Pills Navigation */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map((cat) => {
              const isActive =
                cat.slug === currentCategory ||
                (!currentCategory && cat.id === "all");
              return (
                <Link
                  key={cat.id}
                  href={
                    cat.slug
                      ? `/${locale}/services?category=${encodeURIComponent(cat.slug)}`
                      : `/${locale}/services`
                  }
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {cat.icon ? <cat.icon size={16} aria-hidden="true" /> : null}
                  <span>{t(cat.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search & Secondary Filter Bar */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:flex-1">
            <form action={`/${locale}/services`} method="GET" className="relative w-full">
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-surface-container-low rounded-xl pe-10 ps-4 py-2 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                <Search size={18} aria-hidden="true" />
              </div>
              {category && <input type="hidden" name="category" value={category} />}
            </form>
          </div>

          {/* Fasting Toggle Link */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              href={
                fasting === "no-fasting"
                  ? `/${locale}/services${category ? `?category=${category}` : ""}`
                  : `/${locale}/services?fasting=no-fasting${category ? `&category=${category}` : ""}`
              }
              className={`text-xs px-3 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${
                fasting === "no-fasting"
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <CircleCheckBig size={16} aria-hidden="true" />
              <span>{t("fastingOnly")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Clinical Service Directory Cards Grid */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 mb-12">
        {loadError ? (
          <ErrorState
            title={t("errorTitle")}
            hint={t("errorHint")}
          />
        ) : allServices.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            hint={t("emptyHint")}
            actionHref={`/${locale}/services`}
            actionLabel={t("clearFilters")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allServices.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                locale={locale}
                href={`/${locale}/services/${svc.slug || svc.id}`}
              />
            ))}
          </div>
        )}

        {/* Pagination Navigation */}
        {!loadError && totalPages > 1 && (
          <nav
            aria-label={t("pageOf", { current, pages: totalPages })}
            className="bg-surface-container-lowest p-4 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex items-center justify-between gap-2 mt-6"
          >
            {current > 1 ? (
              <Link
                href={pageHref(locale, category ?? "", q ?? "", fasting ?? "", current - 1)}
                className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
              >
                <ChevronRight size={16} aria-hidden="true" />
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
                href={pageHref(locale, category ?? "", q ?? "", fasting ?? "", current + 1)}
                className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
              >
                <span>{t("pageNext")}</span>
                <ChevronLeft size={16} aria-hidden="true" />
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </section>

      {/* Interactive Pathway & Diagnostic Flow Banner */}
      <section className="w-full bg-surface-container-low py-10 px-4 sm:px-6 lg:px-8 mt-8 border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 text-start max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              {t("pathTitle")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex flex-col gap-1 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  {t("stepNum1")}
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-1">{t("step1Title")}</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t("step1Desc")}
                </p>
              </div>
              <div className="flex flex-col gap-1 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  {t("stepNum2")}
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-1">{t("step2Title")}</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t("step2Desc")}
                </p>
              </div>
              <div className="flex flex-col gap-1 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  {t("stepNum3")}
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-1">{t("step3Title")}</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t("step3Desc")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 w-full md:w-80 text-start flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Headset size={24} aria-hidden="true" />
              <span className="text-sm font-bold">{t("supportTitle")}</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {t("supportDesc")}
            </p>
            <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">{t("supportHotline")}</span>
              <span className="font-bold text-on-surface tracking-wider">{t("supportPhone")}</span>
            </div>
            <a
              href="tel:02188224000"
              className="bg-secondary hover:bg-secondary/90 text-on-secondary py-2.5 rounded-xl text-xs font-medium transition-colors text-center shadow-xs"
            >
              {t("supportCta")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}