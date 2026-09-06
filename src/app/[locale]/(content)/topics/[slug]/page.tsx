import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicHub } from "@/contexts/content/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { ArticleCard } from "@/components/clinical/media-cards";

export default async function TopicHubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const hub = await getTopicHub(slug, locale);
  if (!hub) notFound();

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Breadcrumb */}
        <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}/topics`} className="hover:text-primary transition-colors">
            پایگاه موضوعات سلامت
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-semibold">{hub.topic.name}</span>
        </nav>

        {/* Hero Banner — Natural Topic Pathway (Screen #28) */}
        <section className="relative w-full bg-gradient-to-b from-primary/10 via-surface-container-low/40 to-surface rounded-3xl p-6 sm:p-10 border border-outline-variant/30 overflow-hidden text-start">
          <div className="flex flex-col gap-4 max-w-3xl">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
              {hub.topic.name}
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed text-justify">
              راهنماهای خودمراقبتی، آزمایش‌های دوره‌ای، مقالات آموزشی و پزشکان مرتبط در زمینه {hub.topic.name}.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/${locale}/articles?topic=${hub.topic.slug}`}
                className="inline-flex items-center gap-2 bg-primary text-on-primary text-xs sm:text-sm font-bold px-4 sm:px-5 py-2.5 rounded-xl shadow-xs hover:bg-primary-container transition-all"
              >
                <ClinicalIcon name="menu_book" size={18} />
                <span>مقالات تخصصی {hub.topic.name}</span>
              </Link>
              {hub.conditions.length > 0 && (
                <a
                  href="#conditions"
                  className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-surface-container transition-all"
                >
                  <ClinicalIcon name="vital_signs" size={18} />
                  <span>بیماری‌های مرتبط</span>
                </a>
              )}
              {hub.relatedServices.length > 0 && (
                <a
                  href="#services"
                  className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-surface-container transition-all"
                >
                  <ClinicalIcon name="medical_services" size={18} />
                  <span>خدمات و آزمایش‌ها</span>
                </a>
              )}
              {hub.relatedDoctors.length > 0 && (
                <a
                  href="#doctors"
                  className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-surface-container transition-all"
                >
                  <ClinicalIcon name="stethoscope" size={18} />
                  <span>پزشکان متخصص</span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Section: Articles & Clinical Protocols */}
        <section id="articles" className="flex flex-col gap-6 text-start">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                مقالات و راهنماهای بالینی {hub.topic.name}
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                جدیدترین مقالات پژوهشی و توصیه‌های پزشکان درباره {hub.topic.name}
              </p>
            </div>
            <Link
              href={`/${locale}/articles?topic=${hub.topic.slug}`}
              className="text-xs sm:text-sm text-primary font-bold hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>مشاهده همه مقالات {hub.topic.name}</span>
              <ClinicalIcon name="arrow_back" size={16} />
            </Link>
          </div>

          {hub.content.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hub.content.map((c) => (
                <ArticleCard
                  key={c.id}
                  article={{
                    id: c.id,
                    slug: c.slug,
                    title: c.title,
                    summary: c.body,
                    publishedAt: c.publishedAt,
                    category: hub.topic.name,
                  }}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low p-8 rounded-2xl text-center text-on-surface-variant">
              <p>در حال حاضر مقاله‌ای در این بخش ثبت نشده است.</p>
            </div>
          )}
        </section>

        {/* Section: Medical Conditions & Symptoms (Screen #28) */}
        {hub.conditions.length > 0 && (
          <section id="conditions" className="flex flex-col gap-6 text-start">
            <div className="border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                بیماری‌ها و اختلالات مرتبط
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                تشخیص و راهنمای مدیریت بالینی شرایط پزشکی وابسته به {hub.topic.name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hub.conditions.map((c) => (
                <Link
                  key={c.id}
                  href={`/${locale}/conditions/${c.slug}`}
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-tier-1 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <ClinicalIcon name="stethoscope" size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant">راهنمای بالینی و علائم</p>
                    </div>
                  </div>
                  <ClinicalIcon name="arrow_back" size={16} className="text-outline group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section: Diagnostic Packages & Services */}
        {hub.relatedServices.length > 0 && (
          <section id="services" className="flex flex-col gap-6 text-start">
            <div className="border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                بسته‌های پاراکلینیک و آزمایش‌های تشخیصی
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                خدمات درمانی و چکاپ‌های اختصاصی پایش {hub.topic.name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hub.relatedServices.map((s) => (
                <Link
                  key={s.id}
                  href={s.href.startsWith(`/${locale}`) ? s.href : `/${locale}${s.href.startsWith("/") ? s.href : "/" + s.href}`}
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-tier-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <ClinicalIcon name="medical_services" size={20} />
                    </div>
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {s.subtitle}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                    <span>دریافت خدمت</span>
                    <ClinicalIcon name="arrow_back" size={14} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Section: Specialized Care Pathway & Doctors */}
        {hub.relatedDoctors.length > 0 && (
          <section id="doctors" className="flex flex-col gap-6 text-start">
            <div className="border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                پزشکان متخصص و فوق‌تخصص همکار
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                متخصصان تایید شده بالینی جهت مشاوره و درمان اختلالات {hub.topic.name}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {hub.relatedDoctors.map((d) => (
                <Link
                  key={d.id}
                  href={d.href.startsWith(`/${locale}`) ? d.href : `/${locale}${d.href.startsWith("/") ? d.href : "/" + d.href}`}
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs hover:border-primary/50 hover:shadow-tier-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 font-bold">
                      <ClinicalIcon name="person" size={24} />
                    </div>
                    <h3 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors mb-1">
                      {d.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2">
                      {d.subtitle}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                    <span>رزرو نوبت</span>
                    <ClinicalIcon name="arrow_back" size={14} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}