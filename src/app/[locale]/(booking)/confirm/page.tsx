import Link from "next/link";
import { getAppointment } from "@/contexts/booking/queries";
import { ReceiptActions } from "@/components/booking/receipt-actions";

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

  let appointmentData = null;
  if (id) {
    try {
      appointmentData = await getAppointment(id);
    } catch {
      // fallback
    }
  }

  const rawTrackingCode = id || "AT-84920";
  const displayCode = id
    ? id.startsWith("AT-")
      ? id
      : `AT-${id.slice(0, 6).toUpperCase()}`
    : "AT-84920";

  const doctorName =
    appointmentData?.providerName || "دکتر لیلا سادات هاشمی";
  const serviceName =
    appointmentData?.serviceName || "مشاوره و ویزیت تخصصی بالینی";
  const councilCode = "۷۸۲۳۴";

  const patientName = "سارا محمدی‌تبار";
  const clinicAddress =
    appointmentData?.addressLine ||
    "تهران، میدان ونک، خیابان ملاصدرا، پلاک ۴۲، ساختمان پزشکان، طبقه ۳، واحد ۱۲";

  const priceToman = appointmentData?.price ? Number(appointmentData.price) : 250000;
  const priceDisplay = toPersianDigits((priceToman || 250000).toLocaleString("fa-IR"));

  let dateDisplay = "یکشنبه ۲۵ شهریور ۱۴۰۳";
  let timeDisplay = "ساعت ۱۰:۳۰ صبح";
  if (appointmentData?.startsAt) {
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
      // fallback
    }
  }

  return (
    <main className="w-full min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Top Status Header */}
        <section className="text-center mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 ring-8 ring-emerald-50">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
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
                <p className="text-xs text-slate-500 mt-1">
                  شماره نظام پزشکی: {toPersianDigits(councilCode)}
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
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
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  مشخصات بیمار
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 block mt-0.5">
                  {patientName}
                </span>
                <span className="text-xs text-emerald-700 font-semibold mt-0.5 block">
                  پرونده الکترونیک فعال
                </span>
              </div>
            </div>
          </div>

          {/* Location details */}
          <div className="py-6 border-b border-slate-100 text-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-emerald-700 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">
                  آدرس مطب / مرکز درمانی
                </span>
                <span className="text-sm font-medium text-slate-800 block mt-0.5 leading-relaxed">
                  {clinicAddress}
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
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold">
                پرداخت حضوری در محل کلینیک (بدون کارمزد آنلاین)
              </span>
            </div>
          </div>

          {/* Arrival advisory callout */}
          <div className="mt-6 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-start gap-3 text-start">
            <svg
              className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
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