import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getAppointment } from "@/contexts/booking/queries";
import { ReceiptActions } from "@/components/booking/receipt-actions";
import {
  CalendarDays,
  Check,
  CircleCheckBig,
  Info,
  MapPin,
  User,
} from "lucide-react";
import { formatJalaliDate, formatJalaliTime, toPersianDigits } from "@/lib/format";

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  const { id } = await searchParams;
  const t = await getTranslations("booking");

  const appointmentData = id ? await getAppointment(id).catch(() => null) : null;
  if (!appointmentData) notFound();

  const rawTrackingCode = appointmentData.id;
  const displayCode = rawTrackingCode.startsWith("AT-")
    ? rawTrackingCode
    : `AT-${rawTrackingCode.slice(0, 6).toUpperCase()}`;

  const doctorName = appointmentData.providerName;
  const serviceName = appointmentData.serviceName;
  const clinicAddress = appointmentData.addressLine;

  const dir = locale === "en" ? "ltr" : "rtl";
  const digits = (n: string | number) =>
    locale === "en" ? String(n) : toPersianDigits(n);

  const priceToman = Number(appointmentData.price || 0);
  const priceDisplay = digits(priceToman.toLocaleString("en-US"));

  let dateDisplay = "—";
  let timeDisplay = "—";
  if (appointmentData.startsAt) {
    try {
      const d = new Date(appointmentData.startsAt);
      dateDisplay = formatJalaliDate(d, locale, { weekday: "long" });
      timeDisplay = formatJalaliTime(d, locale);
    } catch {
      // keep placeholder
    }
  }

  const headerTitle = t("receipt.headerTitle");
  const headerSubtitle = t("receipt.headerSubtitle");
  const trackingCodeLabel = t("receipt.trackingCode");
  const visitTimeLabel = t("receipt.visitTime");
  const patientNameLabel = t("receipt.patientName");
  const partySizeLabel = t("receipt.partySize", {
    count: digits(appointmentData.partySize),
    unit: t(
      appointmentData.partySize === 1 ? "receipt.person" : "receipt.people",
    ),
  });
  const addressLabel = t("receipt.address");
  const addressFallback = t("receipt.addressFallback");
  const payableLabel = t("receipt.payable");
  const currencyLabel = t("receipt.currency");
  const guaranteeBadge = t("receipt.guarantee");
  const arrivalNoticeTitle = t("receipt.arrivalTitle");
  const arrivalNoticeSub = t("receipt.arrivalSub");

  return (
    <main className="w-full min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8" dir={dir}>
      <div className="max-w-3xl mx-auto">
        {/* Top Status Header */}
        <section className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 ring-8 ring-emerald-50">
            <Check size={40} aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {headerTitle}
          </h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            {headerSubtitle}
          </p>
          <span className="sr-only">Appointment confirmed</span>
        </section>

        {/* Digital Receipt Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          {/* Top Bar: Doctor/Service + Tracking Code */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl shadow-inner border border-emerald-100 shrink-0">
                {doctorName.slice(0, 2)}
              </div>
              <div className="text-start">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  {doctorName}
                </h2>
                <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                  {serviceName}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:items-end bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
              <span className="text-xs text-slate-500 font-medium mb-1">
                {trackingCodeLabel}
              </span>
              <span
                className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-4 py-1.5 rounded-xl font-mono text-lg font-black tracking-wider select-all"
                title="شناسه نوبت"
              >
                {displayCode}
              </span>
              <span className="sr-only">Reference: {rawTrackingCode}</span>
            </div>
          </div>

          {/* Grid: Timing & Patient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 text-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CalendarDays size={20} aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  {visitTimeLabel}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 block mt-0.5">
                  {dateDisplay}
                </span>
                <span className="text-xs text-slate-600 mt-0.5 block">
                  {timeDisplay}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-emerald-700 flex items-center justify-center shrink-0">
                <User size={20} aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  {patientNameLabel}
                </span>
                {appointmentData.patientName ? (
                  <span className="text-sm sm:text-base font-bold text-slate-900 block mt-0.5">
                    {appointmentData.patientName}
                  </span>
                ) : null}
                {appointmentData.patientPhone ? (
                  <span className="text-xs text-slate-600 mt-0.5 block" dir="ltr">
                    {appointmentData.patientPhone}
                  </span>
                ) : null}
                <span className="text-xs text-slate-600 mt-0.5 block">
                  {partySizeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Location details */}
          <div className="py-6 border-b border-slate-100 text-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin size={20} aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  {addressLabel}
                </span>
                <span className="text-sm font-medium text-slate-800 block mt-0.5 leading-relaxed">
                  {clinicAddress || addressFallback}
                </span>
              </div>
            </div>
          </div>

          {/* Price & Pay-at-clinic Reassurance */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 gap-4 text-start">
            <div>
              <span className="text-xs text-slate-500 block font-medium">
                {payableLabel}
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {priceDisplay}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {currencyLabel}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200/80 px-4 py-2 rounded-2xl">
              <CircleCheckBig size={16} className="text-amber-700" aria-hidden="true" />
              <span className="text-xs font-bold">
                {guaranteeBadge}
              </span>
            </div>
          </div>

          {/* Arrival advisory callout */}
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-start gap-3 text-start">
            <Info size={20} className="text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-emerald-900 leading-relaxed space-y-1">
              <p className="font-semibold">
                {arrivalNoticeTitle}
              </p>
              <p className="text-emerald-800">
                {arrivalNoticeSub}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <ReceiptActions
          trackingCode={displayCode}
          appointmentsHref={`/${locale}/profile/reservations`}
          homeHref={`/${locale}`}
          locale={locale}
        />
      </div>
    </main>
  );
}