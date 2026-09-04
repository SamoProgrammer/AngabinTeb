import Link from "next/link";
import { listTopics } from "@/contexts/content/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits } from "@/components/catalog/doctor-card";

// Mapping topic slugs to clinical icons
function getTopicIcon(slug: string): string {
  switch (slug) {
    case "diabetes":
    case "metabolism":
      return "vital_signs";
    case "cardiology":
    case "heart":
      return "cardiology";
    case "gastro":
    case "liver":
      return "nutrition";
    case "weight":
    case "obesity":
      return "scale";
    case "neurology":
      return "psychology";
    case "women-health":
      return "pregnant_woman";
    default:
      return "health_and_safety";
  }
}

export default async function KnowledgePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const topics = await listTopics(locale);

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header Hero */}
        <div className="flex flex-col gap-4 text-start max-w-3xl">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs sm:text-sm bg-primary/10 px-3 py-1.5 rounded-full self-start">
            <ClinicalIcon name="hub" size={18} />
            <span>پایگاه جامع موضوعات سلامت بالینی</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">
            موضوعات و مراکز تخصصی سلامت
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            مجموعه تخصصی راهنماهای بالینی، پروتکل‌های مراقبت ۳۶۰ درجه، خدمات درمانی و مشاوره‌های فوق‌تخصصی پزشکان بر اساس دسته‌بندی‌های جامع سلامت.
          </p>
        </div>

        {/* Clinical Topics Grid (Screen #2) */}
        <section aria-label="فهرست موضوعات سلامت" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((t) => {
            const iconName = getTopicIcon(t.slug);
            const countText = `${toPersianDigits(Math.max(t.count, 1))} مقاله و راهنمای بالینی`;
            return (
              <Link
                key={t.id}
                href={`/topics/${t.slug}`}
                className="group bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs hover:shadow-tier-2 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between text-start"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ClinicalIcon name={iconName} size={30} />
                  </div>
                  <span className="text-xs bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full font-medium">
                    پایگاه ۳۶۰°
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {t.name}
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    پروتکل‌های درمانی، مراقبت‌های خانگی، آزمایش‌های دوره‌ای و پزشکان مرتبط با {t.name}.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                  <span>{countText}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                    <span>ورود به مرکز</span>
                    <ClinicalIcon name="arrow_back" size={16} />
                  </span>
                </div>
              </Link>
            );
          })}

          {topics.length === 0 && (
            <div className="col-span-full py-12 text-center text-on-surface-variant bg-surface-container-low rounded-2xl">
              <p>در حال حاضر موضوعی ثبت نشده است.</p>
            </div>
          )}
        </section>

        {/* Quick Diagnostic / Services Promo Banner */}
        <div className="bg-gradient-to-r from-primary to-primary-container text-on-primary p-6 sm:p-8 rounded-2xl shadow-tier-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-start">
          <div className="flex flex-col gap-2 max-w-xl">
            <h3 className="text-lg sm:text-xl font-bold">نیاز به راهنمایی در انتخاب تخصص پزشکی دارید؟</h3>
            <p className="text-xs sm:text-sm text-on-primary/90 leading-relaxed">
              با جستجوی علائم بیماری یا مشاوره با کارشناسان سلامت انگبین طب، بهترین مسیر درمانی و نوبت‌دهی را پیدا کنید.
            </p>
          </div>
          <Link
            href={`/${locale}/doctors`}
            className="inline-flex items-center gap-2 bg-on-primary text-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:bg-surface-container-lowest transition-all shrink-0"
          >
            <ClinicalIcon name="search" size={18} />
            <span>یافتن پزشک متخصص</span>
          </Link>
        </div>
      </main>
    </div>
  );
}