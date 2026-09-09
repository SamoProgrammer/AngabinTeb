import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getService } from "@/contexts/catalog/queries";
import { availabilityForService } from "@/contexts/catalog/actions";
import { SlotPicker } from "@/components/booking/slot-picker";
import {
  BadgeCheck,
  Calendar,
  CalendarDays,
  CircleCheckBig,
  Hospital,
  User,
} from "lucide-react";
import { toPersianDigits, formatPrice, formatJalaliDate } from "@/lib/format";
import { JalaliDatePicker } from "@/components/clinical/jalali-date-picker";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale, slug } = await params;
  const { date } = await searchParams;
  const t = await getTranslations("booking");
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  const dbService = await getService(slug, locale).catch(() => null);
  if (!dbService) notFound();

  const service = {
    id: dbService.id,
    name: dbService.name,
    providerName: dbService.providerName,
    serviceType: dbService.serviceType,
    durationMinutes: dbService.durationMinutes,
    basePrice: dbService.basePrice ? Number(dbService.basePrice) : 0,
    addressLine: dbService.addressLine,
  };

  const day = date ?? new Date(Date.now() + 86400_000).toISOString().slice(0, 10);
  let slots: Array<{
    id: string;
    startsAt: Date;
    capacity: number;
    bookedCount: number;
    providerId: string;
    providerName: string;
  }> = [];

  try {
    const rawSlots = await availabilityForService(service.id, day);
    slots = rawSlots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt,
      capacity: s.capacity,
      bookedCount: s.bookedCount,
      providerId: s.providerId,
      providerName: s.providerName,
    }));
  } catch {
    slots = [];
  }

  return (
    <main className="w-full bg-surface py-8 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Service & Provider Summary Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center sm:items-start gap-4 justify-between">
          <div className="flex items-center gap-4 text-start">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Hospital size={32} aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg sm:text-xl font-bold text-on-surface">
                  {service.name}
                </h1>
                <BadgeCheck size={18} fill="currentColor" className="text-primary shrink-0" aria-hidden="true" />
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {t("providerMeta", {
                  provider: service.providerName,
                  minutes: fmt(service.durationMinutes),
                })}
              </p>
              {service.addressLine && (
                <span className="text-xs text-outline mt-1">{service.addressLine}</span>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-outline-variant/20">
            <span className="text-xs text-on-surface-variant">{t("feeLabel")}</span>
            <span className="text-base sm:text-lg font-bold text-primary">
              {formatPrice(service.basePrice, locale)}
            </span>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium mt-1">
              {t("payAtClinic")}
            </span>
          </div>
        </div>

        {/* Step Indicator Simple */}
        <div className="flex items-center justify-between px-2 text-xs sm:text-sm font-medium text-on-surface-variant">
          <span className="text-primary font-bold flex items-center gap-1">
            <CalendarDays size={16} aria-hidden="true" />
            <span>{t("step1")}</span>
          </span>
          <span className="opacity-40">—</span>
          <span className="flex items-center gap-1">
            <User size={16} aria-hidden="true" />
            <span>{t("step2")}</span>
          </span>
          <span className="opacity-40">—</span>
          <span className="flex items-center gap-1">
            <CircleCheckBig size={16} aria-hidden="true" />
            <span>{t("step3")}</span>
          </span>
        </div>

        {/* Calendar & Date Selection Form */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm sm:text-base font-bold text-on-surface flex items-center gap-2">
              <Calendar size={18} className="text-primary" aria-hidden="true" />
              <span>{t("dateTitle")}</span>
            </h2>
            <span className="text-xs text-on-surface-variant">
              {t("selectedDate", { date: formatJalaliDate(`${day}T12:00:00Z`, locale) })}
            </span>
          </div>

          <form action={`/${locale}/services/${slug}/book`} method="GET" className="flex flex-col sm:flex-row items-center gap-3">
            <label htmlFor="date" className="text-xs text-on-surface font-medium shrink-0">
              {t("changeDate")}
            </label>
            <JalaliDatePicker
              locale={locale}
              name="date"
              defaultValue={day}
              min={new Date().toISOString().slice(0, 10)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium rounded-xl transition-colors"
            >
              {t("showSlots")}
            </button>
          </form>
        </div>

        {/* Modernized Slot Picker */}
        <SlotPicker
          slots={slots.map((s) => ({
            id: s.id,
            startsAt: s.startsAt.toISOString(),
            capacity: s.capacity,
            bookedCount: s.bookedCount,
            providerId: s.providerId,
            providerName: s.providerName,
          }))}
          serviceId={service.id}
          locale={locale}
          price={service.basePrice}
        />
      </div>
    </main>
  );
}