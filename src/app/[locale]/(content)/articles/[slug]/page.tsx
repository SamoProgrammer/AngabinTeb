import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getContent } from "@/contexts/content/queries";
import { RichTextView, isRichHtml } from "@/components/clinical/rich-text-view";
import { formatJalaliDate } from "@/lib/format";
import { BriefcaseMedical, Calendar, Clock, Download, Timer, UserCheck } from "lucide-react";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale);
  if (!content) notFound();

  const t = await getTranslations("articles");
  const dir = locale === "en" ? "ltr" : "rtl";

  const rich = isRichHtml(content.body);
  const paragraphs = rich ? [] : content.body.split("\n\n").filter(Boolean);
  const leadParagraph = paragraphs[0] ?? "";
  const remainingParagraphs = paragraphs.slice(1);

  const formattedDate = content.publishedAt
    ? formatJalaliDate(content.publishedAt, locale)
    : "—";

  return (
    <div dir={dir} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label={t("detail.navAria")} className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant mb-6">
          <Link href={`/${locale}/articles`} className="hover:text-primary transition-colors">
            {t("detail.breadcrumb")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-medium line-clamp-1">{content.title}</span>
        </nav>

        {/* Article Main Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight mb-6 max-w-4xl text-start">
          {content.title}
        </h1>

        {/* Published-date & Read Time Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            {content.publishedAt && (
              <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-xs sm:text-sm text-on-surface-variant">
                <Clock size={16} className="text-primary" aria-hidden="true" />
                <span>{formattedDate}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full text-xs sm:text-sm text-on-surface-variant">
              <Timer size={16} className="text-primary" aria-hidden="true" />
              <span>{t("detail.readTime")}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/knowledge/pamphlet`}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary hover:text-on-primary px-3 py-1 rounded-full text-xs font-bold transition-colors"
            >
              <Download size={16} aria-hidden="true" />
              <span>{t("detail.relatedPamphlet")}</span>
            </Link>
          </div>
        </div>

        {/* Video player — rendered only for stored video content */}
        {content.kind === "video" && content.videoUrl && (
          <div className="w-full rounded-2xl overflow-hidden shadow-tier-2 mb-10 bg-inverse-surface">
            <video controls src={content.videoUrl} className="w-full aspect-video rounded-2xl" />
          </div>
        )}

        {/* Main Content Grid with Asymmetric Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 order-2 lg:order-1">
            {/* Clinical Author / Reviewer Card */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-xs text-start flex flex-col gap-3">
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full w-fit">
                {t("detail.reviewerBadge")}
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserCheck size={26} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">{t("detail.reviewerName")}</h3>
                  <p className="text-xs text-primary font-medium">{t("detail.reviewerSpecialty")}</p>
                  <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                    {t("detail.reviewerCouncil")}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed border-t border-outline-variant/15 pt-2">
                {t("detail.reviewerNote")}
              </p>
            </div>

            {/* Clinical Services & Booking CTA */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs text-start flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-on-surface">{t("detail.ctaTitle")}</h2>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {t("detail.ctaDesc")}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/${locale}/booking/doctors`}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-4 rounded-xl text-center font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar size={18} aria-hidden="true" />
                  <span>{t("detail.bookDoctor")}</span>
                </Link>
                <Link
                  href={`/${locale}/booking/diagnostic-services`}
                  className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface py-2.5 px-4 rounded-xl text-center font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <BriefcaseMedical size={18} aria-hidden="true" />
                  <span>{t("detail.diagnosticServices")}</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Editorial Long-form Body */}
          <main className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2 text-start">
            {rich ? (
              <RichTextView value={content.body} />
            ) : (
              <>
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
              </>
            )}
          </main>
        </div>
      </article>
    </div>
  );
}
