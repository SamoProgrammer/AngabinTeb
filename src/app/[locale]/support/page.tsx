import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  Headset,
  PenLine,
  type LucideIcon,
} from "lucide-react";

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("support.hub");
  const isRtl = locale !== "en";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const cards: { kind: "question" | "complaint" | "appointment_issue"; title: string; description: string; icon: LucideIcon }[] = [
    {
      kind: "question" as const,
      title: t("cards.question.title"),
      description: t("cards.question.description"),
      icon: CircleHelp,
    },
    {
      kind: "complaint" as const,
      title: t("cards.complaint.title"),
      description: t("cards.complaint.description"),
      icon: PenLine,
    },
    {
      kind: "appointment_issue" as const,
      title: t("cards.appointment_issue.title"),
      description: t("cards.appointment_issue.description"),
      icon: CalendarDays,
    },
  ];

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header Hero */}
        <div className="flex flex-col gap-3 text-start max-w-3xl">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs sm:text-sm bg-primary/10 px-3 py-1.5 rounded-full self-start">
            <Headset size={18} aria-hidden="true" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {t("description")}
          </p>
        </div>

        {/* Support Inquiry Cards Grid */}
        <section aria-label={t("title")} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <Link
              key={c.kind}
              href={`/${locale}/support/new?kind=${c.kind}`}
              className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs hover:shadow-tier-2 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between text-start group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <c.icon size={26} aria-hidden="true" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors mb-2">
                  {c.title}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                <span>{t("cards.action")}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                  <ArrowIcon size={16} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* Action Links & Requests Redirect */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center gap-3 text-start">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ClipboardList size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">{t("history.title")}</p>
              <p className="text-xs text-on-surface-variant">{t("history.description")}</p>
            </div>
          </div>
          <Link
            href={`/${locale}/support/requests`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
          >
            <span>{t("history.cta")}</span>
            <ArrowIcon size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* FAQ Quick Link Card */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-primary/20 text-start">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <h3 className="text-base sm:text-lg font-bold text-on-surface">
              {t("faq.title")}
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {t("faq.description")}
            </p>
          </div>
          <Link
            href={`/${locale}/faq`}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:bg-primary-container transition-all shrink-0"
          >
            <CircleHelp size={18} aria-hidden="true" />
            <span>{t("faq.cta")}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}