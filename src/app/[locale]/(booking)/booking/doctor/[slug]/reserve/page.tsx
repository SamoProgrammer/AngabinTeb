import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDoctor, listProviderServices } from "@/contexts/catalog/queries";
import { availabilityForService } from "@/contexts/catalog/actions";
import { MapPin, Stethoscope } from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { DoctorReservationForm } from "./reservation-form";

export default async function DoctorReservePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { locale, slug } = await params;
  const { date } = await searchParams;
  const t = await getTranslations("booking");
  const tDoctors = await getTranslations("doctors");
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: number | string) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  const dbDoctor = await getDoctor(slug, locale).catch(() => null);
  if (!dbDoctor) notFound();

  const services = await listProviderServices(dbDoctor.id, locale).catch(() => []);
  const primaryService = services[0] ?? null;

  const selectedDate =
    date ?? new Date(Date.now() + 86400_000).toISOString().slice(0, 10);

  // Real availability only: when the day has no generated slots (or the
  // lookup fails) the form renders its empty state instead of fake times.
  let slots: Array<{
    id: string;
    startsAt: string;
    capacity: number;
    bookedCount: number;
  }> = [];

  if (primaryService) {
    try {
      const rawSlots = await availabilityForService(primaryService.id, selectedDate);
      slots = rawSlots.map((s) => ({
        id: s.id,
        startsAt: new Date(s.startsAt).toISOString(),
        capacity: s.capacity,
        bookedCount: s.bookedCount,
      }));
    } catch {
      slots = [];
    }
  }

  return (
    <main className="w-full bg-surface min-h-screen py-6 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("crumbHome")}
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/booking/doctors`} className="hover:text-primary transition-colors">
            {t("reserve.doctors")}
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/booking/doctor/${slug}`} className="hover:text-primary transition-colors">
            {dbDoctor.name}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">
            {t("reserve.selectTime")}
          </span>
        </div>

        {/* Doctor Summary Card */}
        <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {dbDoctor.imageUrl ? (
              <img
                src={dbDoctor.imageUrl}
                alt={dbDoctor.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-outline-variant/30 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                <Stethoscope size={32} aria-hidden="true" />
              </div>
            )}
            <div className="flex flex-col text-start">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-on-surface">
                  {dbDoctor.name}
                </h1>
                <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {t("reserve.verified")}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-primary font-medium mt-0.5">
                {dbDoctor.specialtyName ?? t("reserve.specialist")}
              </p>
              {dbDoctor.medicalCouncilCode && (
                <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">
                  {t("reserve.council", { code: fmt(dbDoctor.medicalCouncilCode) })}
                </p>
              )}
              {dbDoctor.addressLine && (
                <p className="text-xs text-on-surface-variant/80 mt-1 flex items-center gap-1">
                  <MapPin size={14} className="shrink-0 text-secondary" aria-hidden="true" />
                  <span>{dbDoctor.addressLine}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-surface-container-low px-4 py-3 rounded-xl flex flex-col items-center sm:items-end justify-center text-center sm:text-end shrink-0 w-full sm:w-auto">
            <span className="text-[11px] text-on-surface-variant">
              {t("payAtClinic")}
            </span>
            <span className="text-sm sm:text-base font-bold text-primary">
              {primaryService?.name ?? t("reserve.specialist")}
            </span>
          </div>
        </div>

        {/* Client Interactive Calendar & Reservation Form */}
        {primaryService ? (
          <DoctorReservationForm
            doctorId={dbDoctor.id}
            doctorName={dbDoctor.name}
            doctorSpecialty={dbDoctor.specialtyName ?? ""}
            doctorSlug={slug}
            serviceId={primaryService.id}
            serviceName={primaryService.name}
            initialDate={selectedDate}
            slots={slots}
            locale={locale}
          />
        ) : (
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 text-center flex flex-col items-center gap-3">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {tDoctors("profile.noBookableService")}
            </p>
            <Link
              href={`/${locale}/booking/doctor/${slug}`}
              className="text-xs font-bold text-primary hover:underline"
            >
              {t("reservation.cancelReturn")}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
