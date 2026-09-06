import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listDoctors, listServices } from "@/contexts/catalog/queries";
import { listContent } from "@/contexts/content/queries";
import type { ContentCard } from "@/contexts/content/model";
import { DoctorCard, type DoctorData } from "@/components/catalog/doctor-card";
import { ServiceCard, type ServiceData } from "@/components/catalog/service-card";
import { ArticleCard, VideoCard } from "@/components/clinical/media-cards";
import { UniversalSearchBar } from "@/components/clinical/universal-search-bar";
import { MetabolismCalculator } from "@/components/clinical/metabolism-calculator";
import { TrustMetrics } from "@/components/clinical/trust-metrics";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { EmptyState, ErrorState } from "@/components/clinical/empty-state";
import faMessages from "../../../messages/fa.json";

const faLanding = faMessages.landing as Record<string, string>;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isEn = locale === "en";
  const dir = isEn ? "ltr" : "rtl";
  const forwardArrow = isEn ? "arrow_forward" : "arrow_back";

  let t = (key: string): string => faLanding[key] ?? key;
  try {
    const intlT = await getTranslations("landing");
    t = (key: string) => intlT(key);
  } catch {
    // fallback in environments without next-intl server context
  }

  let doctors: DoctorData[] = [];
  let doctorsError = false;
  try {
    const { rows: raw } = await listDoctors(locale, undefined, undefined, 1, 4);
    doctors = raw.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty ?? t("fallbackSpecialty"),
      cityId: d.cityId,
      imageUrl: d.imageUrl,
      slug: d.id,
      isVerified: false,
    }));
  } catch {
    doctorsError = true;
  }

  let services: ServiceData[] = [];
  let servicesError = false;
  try {
    const { rows: raw } = await listServices(locale, undefined, undefined, 1, 6);
    services = raw.map((s) => ({
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
    servicesError = true;
  }

  let articles: ContentCard[] = [];
  let videos: ContentCard[] = [];
  let contentError = false;
  try {
    const [articleRes, videoRes] = await Promise.all([
      listContent("article", locale),
      listContent("video", locale),
    ]);
    articles = articleRes.rows.slice(0, 3);
    videos = videoRes.rows.slice(0, 3);
  } catch {
    contentError = true;
  }

  const quickActions = [
    {
      titleKey: "qaDoctorsTitle",
      descKey: "qaDoctorsDesc",
      ctaKey: "qaDoctorsCta",
      href: `/${locale}/doctors`,
      icon: "stethoscope",
    },
    {
      titleKey: "qaServicesTitle",
      descKey: "qaServicesDesc",
      ctaKey: "qaServicesCta",
      href: `/${locale}/services`,
      icon: "science",
    },
    {
      titleKey: "qaMetabolismTitle",
      descKey: "qaMetabolismDesc",
      ctaKey: "qaMetabolismCta",
      href: "#metabolism-section",
      icon: "calculate",
    },
    {
      titleKey: "qaDiaryTitle",
      descKey: "qaDiaryDesc",
      ctaKey: "qaDiaryCta",
      href: `/${locale}/nutrition/diary`,
      icon: "restaurant",
    },
    {
      titleKey: "qaDietTitle",
      descKey: "qaDietDesc",
      ctaKey: "qaDietCta",
      href: `/${locale}/nutrition/diet`,
      icon: "spa",
    },
  ];

  return (
    <div className="flex flex-col w-full bg-surface" dir={dir}>
      {/* 1. Ambient Hero Section */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 via-surface to-surface">
        {/* Ambient Glows */}
        <div className="absolute -top-40 end-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 start-10 w-80 h-80 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none" />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 sm:pb-16 w-full text-center relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4 leading-tight sm:leading-snug">
              {t("heroTitle")}
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-3xl mb-8 leading-relaxed">
              {t("heroSubtitle")}
            </p>

            {/* Universal Search Bar */}
            <UniversalSearchBar locale={locale} />
          </div>
        </section>
      </div>

      {/* 2. 5-Fold Quick Action Feature Cards */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label={t("systemsAria")}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
            {t("systemsTitle")}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="group flex flex-col justify-between bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 hover:-translate-y-1 text-start border border-outline-variant/30"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3.5 group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                  <ClinicalIcon name={action.icon} size={26} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-on-surface mb-1.5">
                  {t(action.titleKey)}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t(action.descKey)}
                </p>
              </div>
              <div className="mt-4 pt-2 flex items-center text-primary text-xs font-bold gap-1 group-hover:gap-1.5 transition-all border-t border-outline-variant/15">
                <span>{t(action.ctaKey)}</span>
                <ClinicalIcon name={forwardArrow} size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Specialists Grid */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label={t("doctorsAria")}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div className="text-start">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              {t("doctorsTitle")}
            </h2>
          </div>
          <Link
            href={`/${locale}/doctors`}
            className="flex items-center gap-1 text-primary text-sm font-bold hover:underline"
          >
            <span>{t("doctorsViewAll")}</span>
            <ClinicalIcon name={forwardArrow} size={16} />
          </Link>
        </div>

        {doctorsError ? (
          <ErrorState
            title={t("doctorsErrorTitle")}
            hint={t("doctorsErrorHint")}
          />
        ) : doctors.length === 0 ? (
          <EmptyState
            title={t("doctorsEmptyTitle")}
            hint={t("doctorsEmptyHint")}
            actionHref={`/${locale}/doctors`}
            actionLabel={t("doctorsViewAll")}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                locale={locale}
                href={`/${locale}/doctors/${doc.slug || doc.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Paraclinical Services Showcase */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label={t("servicesAria")}
      >
        <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 md:p-10 border border-outline-variant/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
            <div className="text-start">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                {t("servicesTitle")}
              </h2>
            </div>
            <Link
              href={`/${locale}/services`}
              className="flex items-center gap-1 text-primary text-sm font-bold hover:underline shrink-0"
            >
              <span>{t("servicesViewAll")}</span>
              <ClinicalIcon name={forwardArrow} size={16} />
            </Link>
          </div>

          {servicesError ? (
            <ErrorState
              title={t("servicesErrorTitle")}
              hint={t("servicesErrorHint")}
            />
          ) : services.length === 0 ? (
            <EmptyState
              title={t("servicesEmptyTitle")}
              hint={t("servicesEmptyHint")}
              actionHref={`/${locale}/services`}
              actionLabel={t("servicesViewAll")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((svc) => (
                <ServiceCard
                  key={svc.id}
                  service={svc}
                  locale={locale}
                  href={`/${locale}/services/${svc.slug || svc.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Interactive Metabolism Calculator Section */}
      <section id="metabolism-section">
        <MetabolismCalculator locale={locale} />
      </section>

      {/* 6. Clinical Knowledge & Video Library Showcase */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label={t("knowledgeAria")}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div className="text-start">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              {t("knowledgeTitle")}
            </h2>
          </div>
          <Link
            href={`/${locale}/articles`}
            className="flex items-center gap-1 text-primary text-sm font-bold hover:underline"
          >
            <span>{t("knowledgeViewAll")}</span>
            <ClinicalIcon name={forwardArrow} size={16} />
          </Link>
        </div>

        {contentError ? (
          <ErrorState
            title={t("knowledgeErrorTitle")}
            hint={t("knowledgeErrorHint")}
          />
        ) : articles.length === 0 && videos.length === 0 ? (
          <EmptyState
            title={t("knowledgeEmptyTitle")}
            hint={t("knowledgeEmptyHint")}
            actionHref={`/${locale}/articles`}
            actionLabel={t("knowledgeEmptyAction")}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {articles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={{
                      id: article.id,
                      slug: article.slug,
                      title: article.title,
                      summary: article.body,
                      publishedAt: article.publishedAt,
                    }}
                    locale={locale}
                  />
                ))}
              </div>
            )}
            {videos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={{
                      id: video.id,
                      slug: video.slug,
                      title: video.title,
                      summary: video.body,
                      videoUrl: video.videoUrl,
                      href: `/${locale}/articles/${video.slug}`,
                    }}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 7. Clinical Accreditation, Trust Metrics & Transparency */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <TrustMetrics />
      </section>
    </div>
  );
}