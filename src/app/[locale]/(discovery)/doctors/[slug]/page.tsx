import Link from "next/link";
import { PendingLink } from "@/components/clinical/pending-link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDoctor, listProviderServices } from "@/contexts/catalog/queries";
import {
  ArrowLeft,
  ArrowRight,
  Badge,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Check,
  CircleCheckBig,
  GraduationCap,
  Info,
  MapPin,
  Phone,
  PhoneIncoming,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";
import { RichTextView } from "@/components/clinical/rich-text-view";

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const dbDoctor = await getDoctor(slug, locale).catch(() => null);
  if (!dbDoctor) notFound();

  const t = await getTranslations("doctors");
  const ts = await getTranslations("states");
  const dir = locale === "en" ? "ltr" : "rtl";
  const DirectionArrow = locale === "en" ? ArrowRight : ArrowLeft;
  const fmt = (n: string | number) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  const bookable = await listProviderServices(dbDoctor.id, locale).catch(() => []);
  const bookHref = `/${locale}/booking/doctor/${slug}/reserve`;

  const doctor = {
    id: dbDoctor.id,
    name: dbDoctor.name,
    specialtyName: dbDoctor.specialtyName ?? t("fallbackSpecialty"),
    credentials: dbDoctor.credentials,
    medicalCouncilCode: dbDoctor.medicalCouncilCode,
    landlinePhone: dbDoctor.landlinePhone,
    cvUrl: dbDoctor.cvUrl,
    bio: dbDoctor.bio,
    imageUrl: dbDoctor.imageUrl,
    addressLine: dbDoctor.addressLine,
    phone: dbDoctor.phone,
    latitude: dbDoctor.latitude,
    longitude: dbDoctor.longitude,
  };

  const mapUrl =
    doctor.latitude && doctor.longitude
      ? `https://www.openstreetmap.org/?mlat=${doctor.latitude}&mlon=${doctor.longitude}#map=16/${doctor.latitude}/${doctor.longitude}`
      : null;

  return (
    <main className="w-full bg-surface" dir={dir}>
      {/* Breadcrumb & Status Ambient Bar */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              {t("profile.home")}
            </Link>
            <span className="opacity-40">/</span>
            <Link href={`/${locale}/doctors`} className="hover:text-primary transition-colors">
              {t("profile.doctors")}
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-on-surface font-bold truncate max-w-[200px] sm:max-w-none">
              {doctor.name}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <CircleCheckBig size={14} className="text-primary" aria-hidden="true" />
            {t("profile.inPersonBadge")}
          </span>
        </div>
      </div>

      {/* Hero Profile Master Section */}
      <section className="relative w-full bg-surface-container-lowest shadow-tier-1 py-8 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {doctor.imageUrl ? (
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-sm border-2 border-primary/20 shrink-0">
                <img
                  src={doctor.imageUrl}
                  alt={doctor.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border-2 border-primary/20">
                <Stethoscope size={56} aria-hidden="true" />
              </div>
            )}
            <div className="flex flex-col text-center sm:text-start gap-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {doctor.name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold">
                  <BadgeCheck size={16} fill="currentColor" className="text-primary" aria-hidden="true" />
                  {t("profile.trustedDoctor")}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-primary">
                {doctor.specialtyName}
              </p>
              {doctor.credentials && (
                <p className="text-xs text-on-surface-variant font-medium">
                  {doctor.credentials}
                </p>
              )}
              {doctor.medicalCouncilCode && (
                <p className="text-xs text-on-surface-variant/80 font-mono mt-0.5">
                  {t("profile.medicalCouncil")} {fmt(doctor.medicalCouncilCode)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2 w-full sm:w-auto">
            <PendingLink
              href={bookHref}
              busyLabel={ts("loading")}
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <CalendarDays size={20} aria-hidden="true" />
              <span>{t("profile.bookInPerson")}</span>
            </PendingLink>
          </div>
        </div>
      </section>

      {/* Main Body Content: Review Details + Sticky Booking Card */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Details & Biography Column (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Philosophy & Bio Section */}
          {doctor.bio && (
            <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
                <Badge size={22} aria-hidden="true" />
                <h2>{t("profile.bioTitle")}</h2>
              </div>
              <RichTextView value={doctor.bio} className="text-sm text-justify" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-2.5">
                <GraduationCap size={20} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">{t("profile.credentialsTitle")}</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">{doctor.credentials}</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-2.5">
                <UserCheck size={20} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">{t("profile.licenseTitle")}</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">
                    {t("profile.licenseDesc")}
                  </span>
                </div>
              </div>
            </div>
          </section>
          )}

          {/* Practice Locations & Map Section */}
          <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
            <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <MapPin size={22} className="text-secondary" aria-hidden="true" />
              <span>{t("profile.clinicAddressTitle")}</span>
            </h3>

            <div className="flex flex-col gap-1 pb-3 border-b border-outline-variant/20">
              {doctor.addressLine && (
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                  {doctor.addressLine}
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-primary pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {doctor.landlinePhone && (
                    <span className="flex items-center gap-1 text-on-surface">
                      <PhoneIncoming size={16} className="text-secondary" aria-hidden="true" />
                      <span>{t("profile.clinicPhone")} {fmt(doctor.landlinePhone)}</span>
                    </span>
                  )}
                  {doctor.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={16} aria-hidden="true" />
                      <span>{fmt(doctor.phone)}</span>
                    </span>
                  )}
                </div>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>{t("profile.mapDirections")}</span>
                    <DirectionArrow size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Doctor Booking Sidebar & Tariffs (4 Cols) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
          {/* Booking Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-2 border-2 border-primary/20 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-base font-bold text-on-surface">{t("profile.bookingCardTitle")}</span>
              <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
                {t("profile.payAtClinic")}
              </span>
            </div>

            {/* Bookable Service */}
            {bookable[0] ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface">{t("profile.bookableServiceLabel")}</label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-primary/30">
                  <span className="text-xs font-bold text-on-surface">{bookable[0].name}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {t("profile.noBookableService")}
              </p>
            )}

            {/* Big Booking Button */}
            <PendingLink
              href={bookHref}
              id="bookAppointmentBtn"
              busyLabel={ts("loading")}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <CalendarCheck size={20} aria-hidden="true" />
              <span>{t("profile.submitBookingBtn")}</span>
            </PendingLink>

            <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/80 pt-1">
              <Check size={16} className="text-primary" aria-hidden="true" />
              <span>{t("profile.noBookingFee")}</span>
            </div>
          </div>

          {/* Quick FAQ / Preparation Box */}
          <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col gap-2 text-xs text-on-surface-variant">
            <span className="font-bold text-on-surface flex items-center gap-1.5 text-sm">
              <Info size={18} className="text-primary" aria-hidden="true" />
              {t("profile.prepTipsTitle")}
            </span>
            <ul className="space-y-1.5 pe-4 list-disc leading-relaxed mt-1">
              <li>{t("profile.prepTip1")}</li>
              <li>{t("profile.prepTip2")}</li>
              <li>{t("profile.prepTip3")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}