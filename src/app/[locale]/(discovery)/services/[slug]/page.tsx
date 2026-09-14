import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getService, getPrepInfo } from "@/contexts/catalog/queries";
import {
  Ban,
  Banknote,
  CalendarDays,
  CreditCard,
  Dna,
  Droplet,
  Hospital,
  Info,
  MapPin,
  Pill,
  Timer,
  UserCheck,
} from "lucide-react";
import { toPersianDigits, formatPrice } from "@/lib/format";
import { RichTextView } from "@/components/clinical/rich-text-view";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const dbService = await getService(slug, locale).catch(() => null);
  if (!dbService) notFound();

  const t = await getTranslations("services");
  const dir = locale === "en" ? "ltr" : "rtl";
  const fmt = (n: string | number) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  const service = {
    id: dbService.id,
    name: dbService.name,
    providerName: dbService.providerName,
    providerPhone: dbService.providerPhone,
    serviceType: dbService.serviceType,
    durationMinutes: dbService.durationMinutes,
    basePrice: dbService.basePrice ? Number(dbService.basePrice) : 0,
    addressLine: dbService.addressLine,
  };

  let prep = null;
  if (service.serviceType === "diagnostic") {
    prep = await getPrepInfo(service.id).catch(() => null);
  }

  const fastingHours = prep?.fastingHours ?? null;
  const prepText = prep?.prepInstructions ?? null;
  const bookUrl = `/${locale}/services/${slug}/book`;
  const hasFasting = fastingHours != null && fastingHours > 0;
  const isDiagnosticNoPrep =
    service.serviceType === "diagnostic" && !prep;
  const fastingTitle = hasFasting
    ? t("detail.fastingTitle", { hours: fmt(fastingHours as number) })
    : isDiagnosticNoPrep
      ? t("detail.noRecordTitle")
      : t("detail.noFastingTitle");
  const fastingDesc = hasFasting
    ? t("detail.fastingDesc")
    : isDiagnosticNoPrep
      ? t("detail.noRecordDesc")
      : t("detail.noFastingDesc");
  const medDesc =
    prepText ??
    (service.serviceType === "diagnostic"
      ? t("detail.medDefaultDiagnostic")
      : t("detail.medDefaultOther"));

  return (
    <main className="w-full bg-surface" dir={dir}>
      {/* Breadcrumb & Top Indicator Bar */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant flex-wrap">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            {t("detail.home")}
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/services`} className="hover:text-primary transition-colors">
            {t("detail.services")}
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold truncate max-w-[240px] sm:max-w-none">
            {service.name}
          </span>
        </div>
      </div>

      {/* Service Header Hero Section */}
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-surface border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Service Identity (8 Cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <Dna size={16} aria-hidden="true" />
                  <span>{service.providerName}</span>
                </span>
                <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs">
                  {t("detail.insuranceBadge")}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {service.name}
              </h1>

              {/* Key Metrics Bento Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <Timer size={22} className="text-primary" aria-hidden="true" />
                  <span className="text-xs text-on-surface-variant">{t("detail.durationLabel")}</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {t("detail.durationValue", { minutes: fmt(service.durationMinutes) })}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <UserCheck size={22} className="text-primary" aria-hidden="true" />
                  <span className="text-xs text-on-surface-variant">{t("detail.admissionLabel")}</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {t("detail.admissionValue")}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <Banknote size={22} className="text-primary" aria-hidden="true" />
                  <span className="text-xs text-on-surface-variant">{t("detail.tariffLabel")}</span>
                  <span className="text-sm sm:text-base font-bold text-primary">
                    {formatPrice(service.basePrice, locale)}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <CreditCard size={22} className="text-primary" aria-hidden="true" />
                  <span className="text-xs text-on-surface-variant">{t("detail.settlementLabel")}</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {t("detail.settlementValue")}
                  </span>
                </div>
              </div>
            </div>

            {/* Credential & Quick Booking Card (4 Cols) */}
            <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-2xl shadow-tier-2 border border-outline-variant/30 flex flex-col gap-4 text-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Hospital size={28} aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">{service.providerName}</span>
                  <span className="text-xs text-on-surface-variant">{t("detail.providerPartner")}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 bg-surface-container-low p-3.5 rounded-xl text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">{t("detail.officialTariff")}</span>
                  <span className="font-bold text-primary text-sm">{formatPrice(service.basePrice, locale)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">{t("detail.insuranceCover")}</span>
                  <span className="font-medium text-on-surface">{t("detail.insuranceTypes")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">{t("detail.paymentLabel")}</span>
                  <span className="font-bold text-secondary">{t("detail.payAtClinicGuarantee")}</span>
                </div>
              </div>

              <Link
                href={bookUrl}
                aria-label="Book this service"
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-sm text-center transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <CalendarDays size={18} aria-hidden="true" />
                <span>{t("detail.bookBtn")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* High-Visibility Patient Preparation Warning Box */}
      <section className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4 text-start">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Info size={22} className="text-secondary" aria-hidden="true" />
                <h3 className="font-bold text-base sm:text-lg text-on-surface flex items-center gap-2">
                  <span>{t("detail.prepHeading")}</span>
                  <span className="sr-only">Preparation</span>
                </h3>
              </div>
              <span className="text-xs text-on-surface-variant">
                {t("detail.prepSubheading")}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fasting Card */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                  <Ban size={18} aria-hidden="true" />
                  <span>{fastingTitle}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  {fastingDesc}
                </p>
              </div>

              {/* Water Card */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                  <Droplet size={18} aria-hidden="true" />
                  <span>{t("detail.waterTitle")}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  {t("detail.waterDesc")}
                </p>
              </div>

              {/* Medication Card */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                  <Pill size={18} aria-hidden="true" />
                  <span>{t("detail.medTitle")}</span>
                </div>
                <RichTextView value={medDesc} className="text-xs text-on-surface-variant mt-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Direct CTA Bar */}
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-tier-1">
          <div className="flex items-center gap-3 text-start">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <MapPin size={24} aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant">{t("detail.addressTitle")}</span>
              {service.addressLine ? (
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">{service.addressLine}</span>
              ) : (
                <span className="text-xs text-on-surface-variant mt-0.5">{t("detail.noAddress")}</span>
              )}
              {service.providerPhone && (
                <span className="text-xs text-primary font-medium mt-0.5">
                  {t("detail.phoneLabel")} {fmt(service.providerPhone)}
                </span>
              )}
            </div>
          </div>

          <Link
            href={bookUrl}
            className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-sm text-center transition-all shadow-md shrink-0"
          >
            {t("detail.bookServiceCta")}
          </Link>
        </div>
      </section>
    </main>
  );
}