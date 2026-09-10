"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BadgeCheck, Hospital, BookOpen, Navigation, ShieldPlus, Stethoscope, Siren, UserCheck } from "lucide-react";

export interface ClinicalFooterProps {
  locale?: string;
}

export function ClinicalFooter({ locale = "fa" }: ClinicalFooterProps) {
  const t = useTranslations("footer");
  const isEn = locale === "en";
  const year = new Date().getFullYear();

  const link = (key: string, path: string) => ({
    label: t(key),
    href: `/${locale}${path}`,
  });

  const content = {
    emergency: t("emergencyDisclaimer"),
    guarantee: t("bookingGuarantee"),
    brandTitle: t("aboutTitle"),
    brandSubtitle: t("aboutSubtitle"),
    description: t("aboutText"),
    councilBadge: t("medicalCouncil"),
    securityBadge: t("ehrSecurity"),
    col1Title: t("col1Title"),
    col1Links: [
      link("col1Link1", "/booking/categories"),
      link("col1Link2", "/booking/doctors"),
      link("col1Link3", "/booking/diagnostic-services"),
      link("col1Link4", "/services"),
      link("col1Link5", "/profile/reservations"),
    ],
    col2Title: t("col2Title"),
    col2Links: [
      link("col2Link1", "/diet"),
      link("col2Link2", "/foods"),
      link("col2Link3", "/profile/calorie"),
      link("col2Link4", "/profile/body"),
    ],
    col3Title: t("col3Title"),
    col3Links: [
      link("col3Link1", "/articles"),
      link("col3Link2", "/knowledge/pamphlet"),
      link("col3Link3", "/knowledge/videos"),
      link("col3Link4", "/knowledge/faq"),
      link("col3Link5", "/nutrition-knowledge"),
    ],
    col4Title: t("col4Title"),
    col4Links: [
      link("col4Link1", "/about-us"),
      link("col4Link2", "/contact-us"),
      link("col4Link3", "/work-with-us"),
      link("col4Link4", "/notes/site-help"),
      link("col4Link5", "/complains"),
      link("col4Link6", "/terms-and-conditions"),
    ],
    copyright: t("rights", { year: String(year) }),
    emergencyContact: t("emergencyCall"),
    supportContact: t("contactLine"),
  };

  return (
    <footer
      dir={isEn ? "ltr" : "rtl"}
      className="w-full bg-surface-container-lowest border-t border-outline-variant/30 text-on-surface pb-16 md:pb-0"
    >
      {/* Emergency disclaimer banner */}
      <div className="bg-error-container/40 border-b border-error/20 px-4 py-3 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs md:text-sm font-semibold text-error">
          <Siren size={20} fill="currentColor" className="text-error shrink-0" aria-hidden="true" />
          <span>{content.emergency}</span>
        </div>
      </div>

      {/* Booking transparency banner */}
      <div className="bg-primary/5 border-b border-primary/15 px-4 py-2.5 text-center">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 text-xs md:text-sm font-medium text-primary">
          <UserCheck size={18} fill="currentColor" className="text-primary shrink-0" aria-hidden="true" />
          <span>{content.guarantee}</span>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission Statement */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-tier-1">
                <Hospital size={24} fill="currentColor" aria-hidden="true" />
              </div>
              <div className="flex flex-col text-start">
                <span className="text-lg font-bold text-on-surface leading-tight">
                  {content.brandTitle}
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {content.brandSubtitle}
                </span>
              </div>
            </div>
            <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed max-w-md text-start">
              {content.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <BadgeCheck size={15} className="text-primary" aria-hidden="true" />
                <span>{content.councilBadge}</span>
              </span>
              <span className="text-outline-variant">•</span>
              <span className="inline-flex items-center gap-1">
                <ShieldPlus size={15} className="text-primary" aria-hidden="true" />
                <span>{content.securityBadge}</span>
              </span>
            </div>
          </div>

          {/* 4-column clinical link sitemap */}
          {/* Column 1 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <Navigation size={16} className="text-primary" aria-hidden="true" />
              {content.col1Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col1Links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <Stethoscope size={16} className="text-primary" aria-hidden="true" />
              {content.col2Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col2Links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <BookOpen size={16} className="text-primary" aria-hidden="true" />
              {content.col3Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col3Links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 */}
          <div className="text-start">
            <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-1.5">
              <BadgeCheck size={16} className="text-primary" aria-hidden="true" />
              {content.col4Title}
            </h3>
            <ul className="space-y-2 text-xs md:text-sm text-on-surface-variant">
              {content.col4Links.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar: Trust badges & copyright */}
        <div className="mt-12 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <div className="flex flex-wrap items-center gap-4 text-center md:text-start">
            <p>{content.copyright}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span>{content.emergencyContact}</span>
            <span className="text-outline-variant">|</span>
            <span>{content.supportContact}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
