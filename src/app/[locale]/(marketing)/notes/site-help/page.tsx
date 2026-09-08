import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Banknote,
  CalendarCheck,
  CircleHelp,
  ClipboardList,
  Flower2,
  HousePlus,
  LifeBuoy,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const GUIDE_ICONS: LucideIcon[] = [
  CalendarCheck,
  Banknote,
  ClipboardList,
  Flower2,
  Utensils,
  HousePlus,
  Wallet,
];

interface Guide {
  title: string;
  steps: string[];
}

export default async function SiteHelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("siteHelp");
  const guides = t.raw("guides") as Guide[];
  const isRtl = locale !== "en";

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("breadcrumbHome")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("breadcrumbHelp")}
          </span>
        </div>

        {/* Hero Header */}
        <section className="bg-gradient-to-b from-primary/10 via-surface to-surface p-6 sm:p-10 rounded-3xl border border-outline-variant/30 text-start">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <LifeBuoy size={32} aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {t("heroTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl mt-2 leading-relaxed">
            {t("heroDesc")}
          </p>
        </section>

        {/* Guides Accordion-like Stack */}
        <div className="flex flex-col gap-6 text-start">
          {guides.map((guide, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 rounded-3xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {(() => {
                    const GuideIcon = GUIDE_ICONS[idx] ?? CircleHelp;
                    return <GuideIcon size={22} aria-hidden="true" />;
                  })()}
                </div>
                <h2 className="text-base font-bold text-on-surface">{guide.title}</h2>
              </div>

              <ol className="flex flex-col gap-2.5 text-xs sm:text-sm text-on-surface-variant">
                {guide.steps.map((step, stepIdx) => (
                  <li key={stepIdx} className="flex items-start gap-2 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale === "ar" ? "ar-SA" : "en-US").format(stepIdx + 1)}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
