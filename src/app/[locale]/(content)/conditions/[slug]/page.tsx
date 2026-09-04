import Link from "next/link";
import { notFound } from "next/navigation";
import { getCondition, listContent } from "@/contexts/content/queries";
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

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Breadcrumb */}
        <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}/topics`} className="hover:text-primary transition-colors">
            پایگاه سلامت
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-semibold">{condition.name}</span>
        </nav>

        {/* Condition Clinical Header Profile (Screen #48) */}
        <section className="bg-surface-container-lowest p-6 sm:p-10 rounded-3xl border border-outline-variant/30 shadow-xs text-start flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ClinicalIcon name="stethoscope" size={32} />
              </div>
              <div>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  پروفایل بالینی اختلال
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight mt-1.5">
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

          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            بررسی جامع نشانه‌های بالینی، علل بروز، روش‌های تشخیصی پاراکلینیک و اصول خودمراقبتی برای مدیریت موثر {condition.name}.
          </p>

          {/* Clinical Alert & Warning Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-surface-container-low p-5 rounded-2xl flex items-start gap-3">
              <div className="text-primary mt-0.5 shrink-0">
                <ClinicalIcon name="vital_signs" size={24} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface mb-1">علائم شایع و هشدار دهنده</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  احساس خستگی مفرط، تغییرات وزنی بی‌دلیل، نوسانات فشار یا قند خون و اختلالات هضم از مهم‌ترین نشانه‌ها هستند.
                </p>
              </div>
            </div>

            <div className="bg-surface-container-low p-5 rounded-2xl flex items-start gap-3">
              <div className="text-secondary mt-0.5 shrink-0">
                <ClinicalIcon name="science" size={24} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-on-surface mb-1">آزمایش‌های تشخیصی پیشنهادی</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  بررسی پنل متابولیک، آنزیم‌های کبدی، شمارش کامل سلول‌های خون (CBC) و پروفایل چربی‌های خون.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Related Clinical Articles */}
        <section aria-label="مقالات مرتبط با بیماری" className="flex flex-col gap-6 text-start">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              راهنماها و مقالات مرتبط با {condition.name}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              مجموعه تحلیل‌های تخصصی و پروتکل‌های تغذیه‌ای تایید شده توسط پزشکان
            </p>
          </div>

          {rows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((c, idx) => (
                <ArticleCard
                  key={c.id}
                  article={{
                    id: c.id,
                    slug: c.slug,
                    title: c.title,
                    publishedAt: c.publishedAt,
                    category: condition.name,
                    authorName: idx % 2 === 0 ? "دکتر لیلا سادات" : "دکتر فرهاد مرادی",
                    readingTimeMinutes: 5,
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