"use client";

import { useTranslations } from "next-intl";
import { BadgeDollarSign, Headset, Shield, type LucideIcon } from "lucide-react";

export interface MetricItem {
  value: string;
  label: string;
  subtext: string;
  colorClass?: string;
}

export interface TrustPillar {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColorClass?: string;
}

export interface TrustMetricsProps {
  locale?: string;
  className?: string;
}

export function TrustMetrics({ locale = "fa", className = "" }: TrustMetricsProps) {
  const t = useTranslations("trust");
  const isEn = locale === "en";

  const metrics: MetricItem[] = [
    {
      value: t("metric1Value"),
      label: t("metric1Label"),
      subtext: t("metric1Sub"),
      colorClass: "text-primary",
    },
    {
      value: t("metric2Value"),
      label: t("metric2Label"),
      subtext: t("metric2Sub"),
      colorClass: "text-secondary",
    },
    {
      value: t("metric3Value"),
      label: t("metric3Label"),
      subtext: t("metric3Sub"),
      colorClass: "text-primary",
    },
  ];

  const pillars: TrustPillar[] = [
    {
      icon: Shield,
      title: t("pillar1Title"),
      description: t("pillar1Desc"),
      iconColorClass: "text-primary",
    },
    {
      icon: BadgeDollarSign,
      title: t("pillar2Title"),
      description: t("pillar2Desc"),
      iconColorClass: "text-secondary",
    },
    {
      icon: Headset,
      title: t("pillar3Title"),
      description: t("pillar3Desc"),
      iconColorClass: "text-primary",
    },
  ];

  const ariaLabel = t("aria");

  return (
    <section
      className={`w-full ${className}`}
      dir={isEn ? "ltr" : "rtl"}
      aria-label={ariaLabel}
    >
      <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 md:p-10 border border-outline-variant/30">
        {/* Clinical Counter Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-8">
          {metrics.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-tier-1 border border-outline-variant/20 hover:shadow-tier-2 transition-all flex flex-col items-center justify-center"
            >
              <span
                className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight block ${
                  item.colorClass ?? "text-primary"
                }`}
              >
                {item.value}
              </span>
              <span className="text-xs sm:text-sm font-bold text-on-surface block mt-1.5">
                {item.label}
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant mt-1 leading-snug">
                {item.subtext}
              </span>
            </div>
          ))}
        </div>

        {/* 3 Trust Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-start">
          {pillars.map((pillar, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/20 hover:shadow-tier-2 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                <pillar.icon
                  size={28}
                  className={pillar.iconColorClass ?? "text-primary"}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-on-surface mb-1.5">
                  {pillar.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
