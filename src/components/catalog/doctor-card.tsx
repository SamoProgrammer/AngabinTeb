import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: number | string | null | undefined): string {
  if (input === null || input === undefined) return "";
  return String(input).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === "") return "";
  const str = String(price).trim();
  if (str.includes("تومان")) return str;

  const rawNum = typeof price === "number" ? price : parseFloat(str.replace(/[,٬]/g, ""));
  if (isNaN(rawNum)) return str;

  const withCommas = rawNum.toLocaleString("en-US");
  return `${toPersianDigits(withCommas)} تومان`;
}

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
    specialty = "متخصص بالینی",
    academicTitle = doctor.credentials ?? "عضو هیئت علمی دانشگاه",
    medicalCouncilCode,
    imageUrl,
    rating = 4.9,
    reviewsCount = 120,
    nextSlot = "فردا ساعت ۱۰:۳۰",
    clinicAddress = "کلینیک تخصصی ونک، تهران",
    fee = 250000,
    slug,
    isVerified = true,
  } = doctor;

  const targetHref = href ?? `/${locale}/doctors/${slug || id}`;
  const displayRating = toPersianDigits(rating);
  const displayReviews = toPersianDigits(reviewsCount);
  const displaySlot = toPersianDigits(nextSlot);
  const displayFee = formatPrice(fee);

  return (
    <div
      dir="rtl"
      className={`bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 flex flex-col justify-between text-start relative border border-outline-variant/30 ${className}`}
    >
      {/* Top Rating Pill */}
      <div className="absolute top-4 left-4 flex items-center gap-1 bg-surface-container-low px-2.5 py-1 rounded-full text-secondary text-xs font-bold shadow-xs">
        <ClinicalIcon
          name="star"
          size={16}
          fill
          className="text-secondary shrink-0"
        />
        <span>{displayRating}</span>
        <span className="text-on-surface-variant font-normal">
          {`(${displayReviews} نظر)`}
        </span>
      </div>

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
              <ClinicalIcon name="stethoscope" size={28} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-base font-bold text-on-surface truncate">
                {name}
              </h3>
              {isVerified && (
                <ClinicalIcon
                  name="verified"
                  size={18}
                  className="text-primary shrink-0"
                />
              )}
            </div>

            <p className="text-xs text-on-surface-variant truncate font-medium mb-0.5">
              {specialty}
            </p>

            {academicTitle && (
              <p className="text-[11px] text-primary font-medium truncate">
                {academicTitle}
              </p>
            )}

            {medicalCouncilCode && (
              <p className="text-[10px] text-on-surface-variant/70 font-mono">
                {`نظام پزشکی: ${toPersianDigits(medicalCouncilCode)}`}
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
                <ClinicalIcon
                  name="schedule"
                  size={16}
                  className="text-primary shrink-0"
                />
                <span>نوبت آزاد بعدی:</span>
              </span>
              <span className="font-bold text-on-surface">{displaySlot}</span>
            </div>
          )}

          {/* Clinic Location */}
          {clinicAddress && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-on-surface-variant">
                <ClinicalIcon
                  name="location_on"
                  size={16}
                  className="text-on-surface-variant shrink-0"
                />
                <span>محل مطب:</span>
              </span>
              <span className="truncate max-w-[160px]">{clinicAddress}</span>
            </div>
          )}

          {/* Approved Tariff */}
          <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
            <span className="text-on-surface-variant">حق ویزیت مصوب:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-on-surface">{displayFee}</span>
              <span className="bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5 rounded">
                پرداخت در مطب
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking CTA Button */}
      <Link
        href={targetHref}
        className="w-full bg-primary hover:bg-primary-container text-on-primary text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
      >
        <ClinicalIcon name="calendar_month" size={18} className="shrink-0" />
        <span>رزرو حضوری (پرداخت در مطب)</span>
      </Link>
    </div>
  );
}
