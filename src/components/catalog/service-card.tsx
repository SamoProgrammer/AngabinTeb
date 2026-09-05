import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits, formatPrice } from "@/components/catalog/doctor-card";

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

  const targetHref = href ?? `/${locale}/services/${slug || id}`;
  const displayDuration = durationMinutes === undefined || durationMinutes === null ? null : toPersianDigits(durationMinutes);
  const displayPrice = price === undefined || price === null || price === "" ? null : formatPrice(price);

  return (
    <div
      dir="rtl"
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
            <ClinicalIcon name={iconName} size={20} />
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
            {`ارائه‌دهنده: ${providerName}`}
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
          {fastingHours && fastingHours > 0 ? (
            <div className="flex items-center gap-1.5 text-secondary font-medium">
              <ClinicalIcon name="timer" size={16} className="shrink-0" />
              <span>
                {`نیازمند ${toPersianDigits(fastingHours)} ساعت ناشتایی`}
              </span>
            </div>
          ) : prepInstructions ? (
            <div className="flex items-center gap-1.5 text-secondary font-medium">
              <ClinicalIcon name="timer" size={16} className="shrink-0" />
              <span>{prepInstructions}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <ClinicalIcon name="check_circle" size={16} className="shrink-0" />
              <span>بدون نیاز به آمادگی خاص</span>
            </div>
          )}

          {/* Duration Pill */}
          {displayDuration && (
            <div className="flex items-center gap-1.5">
              <ClinicalIcon
                name="schedule"
                size={16}
                className="text-on-surface-variant shrink-0"
              />
              <span>{`زمان انجام: ${displayDuration} دقیقه`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Price Display and Booking CTA */}
      <div>
        {displayPrice && (
          <div className="flex items-baseline justify-between mb-3 pt-2 border-t border-outline-variant/20">
            <span className="text-xs text-on-surface-variant">هزینه مصوب:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-primary">
                {displayPrice}
              </span>
              <span className="bg-surface-container text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded font-medium">
                پرداخت حضوری
              </span>
            </div>
          </div>
        )}

        <Link
          href={targetHref}
          className="w-full bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary font-medium text-xs sm:text-sm py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <ClinicalIcon name="calendar_month" size={16} className="shrink-0" />
          <span>رزرو نوبت آزمایش</span>
        </Link>
      </div>
    </div>
  );
}
