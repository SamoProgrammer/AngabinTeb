import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCondition, listContent } from "@/contexts/content/queries";
import { searchAll } from "@/contexts/catalog/queries";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseMedical,
  Calendar,
  Stethoscope,
  User,
} from "lucide-react";
import { ArticleCard } from "@/components/clinical/media-cards";

export default async function ConditionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const condition = await getCondition(slug, locale);
  if (!condition) notFound();

  const t = await getTranslations("conditions");
  const dir = locale === "en" ? "ltr" : "rtl";
  const ArrowForwardIcon = dir === "ltr" ? ArrowRight : ArrowLeft;
  const conditionName = condition.name;

  const { rows } = await listContent("article", locale, undefined, condition.id);
  const related = await searchAll(conditionName, locale);
  const relatedServices = related.filter((r) => r.type === "service").slice(0, 4);
  const relatedDoctors = related.filter((r) => r.type === "doctor" || r.type === "clinic").slice(0, 4);

  return (
    <div dir={dir} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Breadcrumb */}
        <nav aria-label={t("navAria")} className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}/topics`} className="hover:text-primary transition-colors">
            {t("breadcrumb")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-semibold">{conditionName}</span>
        </nav>

        {/* Condition Clinical Header Profile */}
        <section className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-outline-variant/30 shadow-xs text-start flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Stethoscope size={32} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                  {conditionName}
                </h1>
              </div>
            </div>

            <Link
              href={`/${locale}/doctors`}
              className="inline-flex items-center gap-2 bg-primary text-on-primary text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs hover:bg-primary-container transition-all self-start sm:self-auto"
            >
              <Calendar size={18} aria-hidden="true" />
              <span>{t("bookDoctorBtn")}</span>
            </Link>
          </div>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-3xl">
            {t("heroDesc", { name: conditionName })}
          </p>
        </section>

        {/* Linked Diagnostic Services */}
        {relatedServices.length > 0 && (
          <section aria-label={t("servicesAria")} className="flex flex-col gap-6 text-start">
            <div className="border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                {t("servicesHeading")}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                {t("servicesSubtitle", { name: conditionName })}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedServices.map((s) => (
                <Link
                  key={s.id}
                  href={s.href.startsWith(`/${locale}`) ? s.href : `/${locale}${s.href.startsWith("/") ? s.href : "/" + s.href}`}
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-tier-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <BriefcaseMedical size={20} aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {s.subtitle}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                    <span>{t("getService")}</span>
                    <ArrowForwardIcon size={14} aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Linked Doctors & Specialists */}
        {relatedDoctors.length > 0 && (
          <section aria-label={t("doctorsAria")} className="flex flex-col gap-6 text-start">
            <div className="border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                {t("doctorsHeading")}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                {t("doctorsSubtitle", { name: conditionName })}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedDoctors.map((d) => (
                <Link
                  key={d.id}
                  href={d.href.startsWith(`/${locale}`) ? d.href : `/${locale}${d.href.startsWith("/") ? d.href : "/" + d.href}`}
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-tier-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 font-bold">
                      <User size={24} aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors mb-1">
                      {d.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {d.subtitle}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                    <span>{t("bookDoctor")}</span>
                    <ArrowForwardIcon size={14} aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Clinical Articles */}
        <section aria-label={t("articlesAria")} className="flex flex-col gap-6 text-start">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              {t("articlesHeading", { name: conditionName })}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              {t("articlesSubtitle")}
            </p>
          </div>

          {rows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((c) => (
                <ArticleCard
                  key={c.id}
                  article={{
                    id: c.id,
                    slug: c.slug,
                    title: c.title,
                    summary: c.body,
                    publishedAt: c.publishedAt,
                    category: conditionName,
                  }}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low p-10 rounded-2xl text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
              <BookOpen size={40} className="text-outline" aria-hidden="true" />
              <p className="text-sm font-medium">{t("noArticles")}</p>
              <Link
                href={`/${locale}/articles`}
                className="text-xs text-primary font-bold hover:underline"
              >
                {t("allArticlesLink")}
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
