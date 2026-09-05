import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/contexts/content/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale);
  if (!content) notFound();

  const paragraphs = content.body.split("\n\n").filter(Boolean);
  const leadParagraph = paragraphs[0] ?? "";
  const remainingParagraphs = paragraphs.slice(1);

  const formattedDate = content.publishedAt
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(content.publishedAt))
    : "—";

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant mb-6">
          <Link href={`/${locale}/articles`} className="hover:text-primary transition-colors">
            مجله سلامت
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-medium line-clamp-1">{content.title}</span>
        </nav>

        {/* Article Main Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight mb-6 max-w-4xl text-start">
          {content.title}
        </h1>

        {/* Published-date strip — shown only when stored */}
        {content.publishedAt && (
          <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs mb-8">
            <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-xs sm:text-sm text-on-surface-variant">
              <ClinicalIcon name="schedule" size={16} className="text-primary" />
              <span>{formattedDate}</span>
            </span>
          </div>
        )}

        {/* Video player — rendered only for stored video content */}
        {content.kind === "video" && content.videoUrl && (
          <div className="w-full rounded-2xl overflow-hidden shadow-tier-2 mb-10 bg-inverse-surface">
            <video controls src={content.videoUrl} className="w-full aspect-video rounded-2xl" />
          </div>
        )}

        {/* Main Content Grid with Asymmetric Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar (Screen #42) */}
          <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 order-2 lg:order-1">
            {/* Clinical Services & Booking CTA */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs text-start flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-on-surface">مشاوره و خدمات درمانی</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  جهت بررسی شرایط بالینی یا انجام آزمایش‌های تشخیصی، نوبت خود را آنلاین رزرو کنید.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/${locale}/doctors`}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-4 rounded-xl text-center font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <ClinicalIcon name="calendar_today" size={18} />
                  <span>دریافت نوبت ویزیت با پزشک</span>
                </Link>
                <Link
                  href={`/${locale}/services`}
                  className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-2.5 px-4 rounded-xl text-center font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ClinicalIcon name="medical_services" size={18} />
                  <span>خدمات و آزمایش‌های تشخیصی</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Editorial Long-form Body */}
          <main className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2 text-start">
            {/* Intro Lead */}
            {leadParagraph && (
              <div className="bg-surface-container-low/70 border border-outline-variant/30 p-6 sm:p-8 rounded-2xl shadow-xs">
                <p className="text-base sm:text-lg text-on-surface font-medium leading-relaxed">
                  {leadParagraph}
                </p>
              </div>
            )}

            {/* Article Body Paragraphs */}
            <div className="space-y-5 text-sm sm:text-base text-on-surface leading-relaxed">
              {remainingParagraphs.map((p, idx) => (
                <p key={idx} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </main>
        </div>
      </article>
    </div>
  );
}