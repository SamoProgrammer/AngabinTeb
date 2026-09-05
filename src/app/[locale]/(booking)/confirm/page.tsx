import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppointment } from "@/contexts/booking/queries";
import { ReceiptActions } from "@/components/booking/receipt-actions";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

function toPersianDigits(n: string | number): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { locale } = await params;
  const { id } = await searchParams;

  const appointmentData = id ? await getAppointment(id).catch(() => null) : null;
  if (!appointmentData) notFound();

  const rawTrackingCode = appointmentData.id;
  const displayCode = rawTrackingCode.startsWith("AT-")
    ? rawTrackingCode
    : `AT-${rawTrackingCode.slice(0, 6).toUpperCase()}`;

  const doctorName = appointmentData.providerName;
  const serviceName = appointmentData.serviceName;
  const clinicAddress = appointmentData.addressLine;

  const priceToman = Number(appointmentData.price || 0);
  const priceDisplay = toPersianDigits(priceToman.toLocaleString("fa-IR"));

  let dateDisplay = "—";
  let timeDisplay = "—";
  if (appointmentData.startsAt) {
    try {
      const d = new Date(appointmentData.startsAt);
      dateDisplay = new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "full",
      }).format(d);
      timeDisplay = new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      // keep placeholder
    }
  }

  return (
    <main className="w-full min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-3xl mx-auto">
        {/* Top Status Header */}
        <section className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 ring-8 ring-emerald-50">
            <ClinicalIcon name="check" size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            نوبت بالینی شما با موفقیت ثبت شد
          </h1>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            پیامک تایید حاوی اطلاعات نوبت برای شما ارسال گردید.
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
                کد پیگیری پذیرش
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
                <ClinicalIcon name="calendar_month" size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  زمان مراجعه حضوری
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
                <ClinicalIcon name="person" size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  نام بیمار
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
                  {toPersianDigits(appointmentData.partySize)} نفر
                </span>
              </div>
            </div>
          </div>

          {/* Location details */}
          <div className="py-6 border-b border-slate-100 text-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ClinicalIcon name="location_on" size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  آدرس مطب / مرکز درمانی
                </span>
                <span className="text-sm font-medium text-slate-800 block mt-0.5 leading-relaxed">
                  {clinicAddress || "نشانی ثبت نشده است."}
                </span>
              </div>
            </div>
          </div>

          {/* Price & Pay-at-clinic Reassurance */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 gap-4 text-start">
            <div>
              <span className="text-xs text-slate-500 block font-medium">
                مبلغ قابل پرداخت در مطب:
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {priceDisplay}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  تومان
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-50 text-amber-900 border border-amber-200/80 px-4 py-2 rounded-2xl">
              <ClinicalIcon name="check_circle" size={16} className="text-amber-700" />
              <span className="text-xs font-bold">
                پرداخت حضوری در محل کلینیک (بدون کارمزد آنلاین)
              </span>
            </div>
          </div>

          {/* Arrival advisory callout */}
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-start gap-3 text-start">
            <ClinicalIcon name="info" size={20} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed space-y-1">
              <p className="font-semibold">
                لطفاً ۱۵ دقیقه پیش از ساعت مقرر در محل حضور داشته باشید.
              </p>
              <p className="text-emerald-800">
                در صورت نیاز به جابجایی یا انصراف از نوبت، از بخش پیگیری در
                پرونده من اقدام فرمایید.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <ReceiptActions
          trackingCode={displayCode}
          appointmentsHref={`/${locale}/appointments`}
          homeHref={`/${locale}`}
        />

        {/* Hidden back-compat anchor for legacy crawlers/tests if needed */}
        <div className="sr-only">
          <Link href={`/${locale}/appointments`}>View my appointments</Link>
        </div>
      </div>
    </main>
  );
}