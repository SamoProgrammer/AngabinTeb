import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listContent } from "@/contexts/content/queries";
import { toPlainText } from "@/components/clinical/rich-text-view";
import { Download, FileDown, FileText } from "lucide-react";

export default async function PamphletsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("pamphlet");
  const dir = locale === "en" ? "ltr" : "rtl";

  const { rows } = await listContent("pamphlet", locale);

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("breadcrumbHome")}
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/articles`} className="hover:text-primary transition-colors">
            {t("breadcrumbContent")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("breadcrumbPamphlets")}
          </span>
        </div>

        {/* Header Banner */}
        <section className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 via-surface to-surface py-8 sm:py-12 rounded-3xl p-6 sm:p-10 border border-outline-variant/30 text-start">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileDown size={28} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
                {t("badge")}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface mt-1">
                {t("heroTitle")}
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {t("heroDesc")}
          </p>
        </section>

        {/* Pamphlet Grid — live published pamphlets from the content kernel */}
        {rows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rows.map((p) => (
              <div
                key={p.id}
                className="bg-surface-container-lowest p-6 rounded-3xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 border border-outline-variant/30 flex flex-col justify-between text-start"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText size={20} aria-hidden="true" />
                    </div>
                  </div>

                  <Link href={`/${locale}/articles/${p.slug}`}>
                    <h3 className="text-base font-bold text-on-surface mb-2 leading-snug hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-4">
                    {toPlainText(p.body)}
                  </p>
                </div>

                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(`${p.title}\n\n${toPlainText(p.body)}`)}`}
                  download={`${p.slug}.txt`}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download size={16} aria-hidden="true" />
                  <span>{t("downloadBtn")}</span>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <FileDown size={48} className="text-outline" aria-hidden="true" />
            <p className="text-base font-bold text-on-surface">{t("heroTitle")}</p>
            <p className="text-xs text-on-surface-variant max-w-md leading-relaxed">{t("heroDesc")}</p>
            <Link
              href={`/${locale}/articles`}
              className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-semibold"
            >
              {t("breadcrumbContent")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
