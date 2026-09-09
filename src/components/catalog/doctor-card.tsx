"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BadgeCheck, CalendarDays, MapPin, Clock, Star, Stethoscope } from "lucide-react";

import { toPersianDigits, formatPrice } from "@/lib/format";

export interface DoctorData {
  id: string;
  name: string;
  specialty?: string | null;
  academicTitle?: string | null;
  credentials?: string | null;
  medicalCouncilCode?: string | null;
  imageUrl?: string | null;
  rating?: number | string;
  reviewsCount?: number | string;
  nextSlot?: string | null;
  clinicAddress?: string | null;
  cityId?: string | null;
  fee?: number | string | null;
  slug?: string | null;
  isVerified?: boolean;
}

export interface DoctorCardProps {
  doctor: DoctorData;
  locale?: string;
  className?: string;
  href?: string;
}

export function DoctorCard({
  doctor,
  locale = "fa",
  className = "",
  href,
}: DoctorCardProps) {
  const {
    id,
    name,
    specialty = null,
    academicTitle = doctor.credentials ?? null,
    medicalCouncilCode,
    imageUrl,
    rating,
    reviewsCount,
    nextSlot,
    clinicAddress,
    fee,
    slug,
    isVerified = false,
  } = doctor;

  const t = useTranslations("doctors");
  const isEn = locale === "en";
  const dir = isEn ? "ltr" : "rtl";

  const targetHref = href ?? `/${locale}/doctors/${slug || id}`;
  const displaySpecialty = specialty ?? t("fallbackSpecialty");
  const displayRating = rating === undefined || rating === null ? null : (isEn ? String(rating) : toPersianDigits(rating));
  const displayReviews = reviewsCount === undefined || reviewsCount === null ? null : (isEn ? String(reviewsCount) : toPersianDigits(reviewsCount));
  const displaySlot = nextSlot ? (isEn ? String(nextSlot) : toPersianDigits(nextSlot)) : null;
  const displayFee = fee === undefined || fee === null || fee === "" ? null : formatPrice(fee, locale);

  const reviewsLabel = t("cardReviews", { count: displayReviews ?? "" });

  const councilLabel = t("cardCouncil", {
    code:
      locale === "fa" || locale === "ar"
        ? toPersianDigits(medicalCouncilCode)
        : String(medicalCouncilCode ?? ""),
  });

  const slotLabel = t("cardNextSlot");
  const clinicLabel = t("cardClinic");
  const feeLabel = t("cardFee");
  const payAtClinicLabel = t("cardPayAtClinic");
  const ctaLabel = t("cardCta");
  const ctaAria = t("cardCtaAria");

  return (
    <div
      dir={dir}
      className={`bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 flex flex-col justify-between text-start relative border border-outline-variant/30 ${className}`}
    >
      {/* Top Rating Pill */}
      {displayRating && (
        <div className="absolute top-4 end-4 flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-full text-secondary text-xs font-bold shadow-xs">
          <Star
            size={16}
            fill="currentColor"
            className="text-secondary shrink-0"
            aria-hidden="true"
          />
          <span>{displayRating}</span>
          {displayReviews && (
            <span className="text-on-surface-variant font-normal">
              {reviewsLabel}
            </span>
          )}
        </div>
      )}

      <div>
        {/* Physician Header (Avatar + Info) */}
        <div className="flex items-start gap-3.5 mb-4 pe-16">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover shadow-xs shrink-0 border border-outline-variant/30"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Stethoscope size={28} aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-base font-bold text-on-surface truncate">
                <Link href={targetHref} className="hover:text-primary transition-colors">
                  {name}
                </Link>
              </h3>
              {isVerified && (
                <BadgeCheck
                  size={18}
                  className="text-primary shrink-0"
                  aria-hidden="true"
                />
              )}
            </div>

            <p className="text-xs text-on-surface-variant truncate font-medium mb-0.5">
              {displaySpecialty}
            </p>

            {academicTitle && (
              <p className="text-[11px] text-primary font-medium truncate">
                {academicTitle}
              </p>
            )}

            {medicalCouncilCode && (
              <p className="text-[10px] text-on-surface-variant/70 font-mono">
                {councilLabel}
              </p>
            )}
          </div>
        </div>

        {/* Clinical Info Box */}
        <div className="bg-surface-container-low p-3 rounded-xl mb-4 flex flex-col gap-2 text-xs text-on-surface-variant">
          {/* Next Available Slot */}
          {nextSlot && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-on-surface-variant">
                <Clock
                  size={16}
                  className="text-primary shrink-0"
                  aria-hidden="true"
                />
                <span>{slotLabel}</span>
              </span>
              <span className="font-bold text-on-surface">{displaySlot}</span>
            </div>
          )}

          {/* Clinic Location */}
          {clinicAddress && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-on-surface-variant">
                <MapPin
                  size={16}
                  className="text-on-surface-variant shrink-0"
                  aria-hidden="true"
                />
                <span>{clinicLabel}</span>
              </span>
              <span className="truncate max-w-[160px]">{clinicAddress}</span>
            </div>
          )}

          {/* Approved Tariff */}
          {displayFee && (
            <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
              <span className="text-on-surface-variant">{feeLabel}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-on-surface">{displayFee}</span>
                <span className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded">
                  {payAtClinicLabel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking CTA Button */}
      <Link
        href={targetHref}
        aria-label={ctaAria}
        className="w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <CalendarDays size={18} className="shrink-0" aria-hidden="true" />
        <span>{ctaLabel}</span>
      </Link>
    </div>
  );
}
