"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CalendarDays, CircleCheckBig, Clock, Timer } from "lucide-react";
import { resolveIcon } from "@/components/clinical/icons";
import { toPersianDigits, formatPrice } from "@/lib/format";

export interface ServiceData {
  id: string;
  name: string;
  category?: string | null;
  serviceType?: string | null;
  providerName?: string | null;
  description?: string | null;
  fastingHours?: number | null;
  prepInstructions?: string | null;
  durationMinutes?: number | null;
  price?: number | string | null;
  slug?: string | null;
  iconName?: string;
}

export interface ServiceCardProps {
  service: ServiceData;
  locale?: string;
  className?: string;
  href?: string;
}

export function ServiceCard({
  service,
  locale = "fa",
  className = "",
  href,
}: ServiceCardProps) {
  const {
    id,
    name,
    category = service.serviceType ?? null,
    providerName,
    description,
    fastingHours,
    prepInstructions,
    durationMinutes,
    price,
    slug,
    iconName = "science",
  } = service;

  const isEn = locale === "en";
  const t = useTranslations("services");
  const dir = isEn ? "ltr" : "rtl";
  const ServiceIcon = resolveIcon(iconName);

  const targetHref = href ?? `/${locale}/services/${slug || id}`;
  const displayDuration = durationMinutes === undefined || durationMinutes === null ? null : (isEn ? String(durationMinutes) : toPersianDigits(durationMinutes));
  const displayPrice = price === undefined || price === null || price === "" ? null : formatPrice(price, locale);

  const providerLabel = providerName
    ? t("cardProvider", { provider: providerName })
    : null;

  const localizedFastingHours =
    locale === "fa" || locale === "ar"
      ? toPersianDigits(fastingHours)
      : String(fastingHours ?? "");
  const fastingLabel = fastingHours && fastingHours > 0
    ? t("cardFasting", { hours: localizedFastingHours })
    : null;

  const noPrepLabel = t("cardNoPrep");

  const durationLabel = displayDuration
    ? t("cardDuration", { minutes: displayDuration })
    : null;

  const feeLabel = t("cardFee");
  const payAtClinicLabel = t("cardPayAtClinic");
  const ctaLabel = t("cardCta");

  return (
    <div
      dir={dir}
      className={`bg-surface-container-lowest rounded-2xl p-5 shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 flex flex-col justify-between text-start border border-outline-variant/30 ${className}`}
    >
      <div>
        {/* Top Header: Category Pill & Icon */}
        <div className="flex items-center justify-between mb-3">
          {category ? (
            <span className="bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full text-xs font-bold">
              {category}
            </span>
          ) : (
            <span />
          )}
          <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <ServiceIcon size={20} aria-hidden="true" />
          </span>
        </div>

        {/* Service Name */}
        <h3 className="text-base font-bold text-on-surface mb-1.5">
          <Link href={targetHref} className="hover:text-primary transition-colors">
            {name}
          </Link>
        </h3>

        {/* Provider Name if available */}
        {providerName && (
          <p className="text-xs text-primary font-medium mb-2">
            {providerLabel}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2 mb-4">
            {description}
          </p>
        )}

        {/* Guidelines / Preparation and Duration Chips */}
        <div className="space-y-2 text-xs text-on-surface-variant mb-4 bg-surface-container-low/60 p-3 rounded-xl border border-outline-variant/20">
          {/* Fasting Warning Chip */}
          {fastingLabel ? (
            <div className="flex items-center gap-1.5 text-secondary font-medium">
              <Timer size={16} className="shrink-0" aria-hidden="true" />
              <span>{fastingLabel}</span>
            </div>
          ) : prepInstructions ? (
            <div className="flex items-center gap-1.5 text-secondary font-medium">
              <Timer size={16} className="shrink-0" aria-hidden="true" />
              <span>{prepInstructions}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <CircleCheckBig size={16} className="shrink-0" aria-hidden="true" />
              <span>{noPrepLabel}</span>
            </div>
          )}

          {/* Duration Pill */}
          {durationLabel && (
            <div className="flex items-center gap-1.5">
              <Clock
                size={16}
                className="text-on-surface-variant shrink-0"
                aria-hidden="true"
              />
              <span>{durationLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Price Display and Booking CTA */}
      <div>
        {displayPrice && (
          <div className="flex items-baseline justify-between mb-3 pt-2 border-t border-outline-variant/20">
            <span className="text-xs text-on-surface-variant">{feeLabel}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-primary">
                {displayPrice}
              </span>
              <span className="bg-surface-container text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded font-medium">
                {payAtClinicLabel}
              </span>
            </div>
          </div>
        )}

        <Link
          href={targetHref}
          className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary font-medium text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <CalendarDays size={16} className="shrink-0" aria-hidden="true" />
          <span>{ctaLabel}</span>
        </Link>
      </div>
    </div>
  );
}
