import { getContent, listContent } from "@/contexts/content/queries";
import type { ContentDetail } from "@/contexts/content/model";
import { FaqClient } from "./faq-client";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { rows } = await listContent("faq", locale);
  const faqs = (
    await Promise.all(rows.map((r) => getContent(r.slug, locale)))
  ).filter((f): f is ContentDetail => f !== null);

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header Hero (Screen #29) */}
        <section className="text-center flex flex-col items-center gap-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs sm:text-sm bg-primary/10 px-3 py-1.5 rounded-full">
            <ClinicalIcon name="help" size={18} />
            <span>راهنمای جامع بیماران و مراجعین</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">
            پرسش‌های متداول و راهنمای مراجعین
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">
            پاسخ‌های شفاف، سریع و بالینی به سوالات پرتکرار شما پیرامون نوبت‌دهی، بیمه‌ها و خدمات سلامت انگبین طب
          </p>
        </section>

        {/* Interactive FAQ Client Section */}
        <FaqClient dbFaqs={faqs} locale={locale} />
      </main>
    </div>
  );
}