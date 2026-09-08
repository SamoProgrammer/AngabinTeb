import { getTranslations } from "next-intl/server";
import { listContent } from "@/contexts/content/queries";
import { FaqClient } from "./faq-client";

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("faq");
  const dir = locale === "en" ? "ltr" : "rtl";

  const { rows } = await listContent("faq", locale);
  const faqs = rows.map((r) => ({ id: r.id, title: r.title, body: r.body }));

  return (
    <div dir={dir} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header Hero (Screen #29) */}
        <section className="text-center flex flex-col items-center gap-2 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">
            {t("subtitle")}
          </p>
        </section>

        {/* Interactive FAQ Client Section */}
        <FaqClient dbFaqs={faqs} locale={locale} />
      </main>
    </div>
  );
}
