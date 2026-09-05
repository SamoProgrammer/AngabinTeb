import Link from "next/link";
import { notFound } from "next/navigation";
import { getCondition, listContent } from "@/contexts/content/queries";
import { searchAll } from "@/contexts/catalog/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { ArticleCard } from "@/components/clinical/media-cards";

export default async function ConditionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const condition = await getCondition(slug, locale);
  if (!condition) notFound();

  const { rows } = await listContent("article", locale, undefined, condition.id);
  const related = await searchAll(condition.name, locale);
  const relatedServices = related.filter((r) => r.type === "service").slice(0, 4);
  const relatedDoctors = related.filter((r) => r.type === "doctor" || r.type === "clinic").slice(0, 4);

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Breadcrumb */}
        <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}/topics`} className="hover:text-primary transition-colors">
            پایگاه موضوعات سلامت
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-semibold">{condition.name}</span>
        </nav>

        {/* Condition Clinical Header Profile */}
        <section className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-outline-variant/30 shadow-xs text-start flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ClinicalIcon name="stethoscope" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                  {condition.name}
                </h1>
              </div>
            </div>

            <Link
              href={`/${locale}/doctors`}
              className="inline-flex items-center gap-2 bg-primary text-on-primary text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs hover:bg-primary-container transition-all self-start sm:self-auto"
            >
              <ClinicalIcon name="calendar_today" size={18} />
              <span>نوبت‌دهی پزشک متخصص</span>
            </Link>
          </div>

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-3xl">
            بررسی نشانه‌های بالینی، روش‌های پایش و پیشگیری، آزمایش‌های تشخیصی مرتبط و متخصصان همکار برای پایش و درمان {condition.name}.
          </p>
        </section>

        {/* Linked Diagnostic Services */}
        {relatedServices.length > 0 && (
          <section aria-label="خدمات تشخیصی مرتبط" className="flex flex-col gap-6 text-start">
            <div className="border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                آزمایش‌ها و خدمات تشخیصی مرتبط
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                بسته‌ها و چکاپ‌های بالینی جهت بررسی دقیق و پایش {condition.name}
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

        {/* Linked Doctors & Specialists */}
        {relatedDoctors.length > 0 && (
          <section aria-label="پزشکان متخصص مرتبط" className="flex flex-col gap-6 text-start">
            <div className="border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                پزشکان و متخصصان مرتبط
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                پزشکان تایید شده بالینی جهت مشاوره و مدیریت تخصصی {condition.name}
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

        {/* Related Clinical Articles */}
        <section aria-label="مقالات مرتبط با بیماری" className="flex flex-col gap-6 text-start">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              راهنماها و مقالات مرتبط با {condition.name}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              مجموعه تحلیل‌های تخصصی و پروتکل‌های مراقبتی تایید شده توسط پزشکان
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
                    category: condition.name,
                  }}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low p-10 rounded-2xl text-center text-on-surface-variant flex flex-col items-center justify-center gap-3">
              <ClinicalIcon name="menu_book" size={40} className="text-outline" />
              <p className="text-sm font-medium">مقاله‌ای مستقیماً برای این عنوان پیوند نیافته است.</p>
              <Link
                href={`/${locale}/articles`}
                className="text-xs text-primary font-bold hover:underline"
              >
                مشاهده تمام مقالات مجله سلامت
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}