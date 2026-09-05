import Link from "next/link";
import { notFound } from "next/navigation";
import { getService, getPrepInfo } from "@/contexts/catalog/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits, formatPrice } from "@/components/catalog/doctor-card";

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const dbService = await getService(slug, locale).catch(() => null);
  if (!dbService) notFound();

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

  return (
    <main className="w-full bg-surface" dir="rtl">
      {/* Breadcrumb & Top Indicator Bar */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant flex-wrap">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">
            خانه
          </Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/services`} className="hover:text-primary transition-colors">
            خدمات درمانی و پاراکلینیک
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
                  <ClinicalIcon name="biotech" size={16} />
                  <span>{service.providerName}</span>
                </span>
                <span className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-xs">
                  پوشش کلیه بیمه‌های پایه و تکمیلی
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                {service.name}
              </h1>

              {/* Key Metrics Bento Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <ClinicalIcon name="timer" size={22} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">زمان انجام</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {toPersianDigits(service.durationMinutes)} دقیقه
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <ClinicalIcon name="verified_user" size={22} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">پذیرش رسمی</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    با هماهنگی قبلی
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <ClinicalIcon name="payments" size={22} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">تعرفه مصوب خدمت</span>
                  <span className="text-sm sm:text-base font-bold text-primary">
                    {formatPrice(service.basePrice)}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-start">
                  <ClinicalIcon name="credit_card_off" size={22} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">شیوه تسویه</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    پرداخت در مطب (حضوری)
                  </span>
                </div>
              </div>
            </div>

            {/* Credential & Quick Booking Card (4 Cols) */}
            <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-2xl shadow-tier-2 border border-outline-variant/30 flex flex-col gap-4 text-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <ClinicalIcon name="local_hospital" size={28} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface">{service.providerName}</span>
                  <span className="text-xs text-on-surface-variant">طرف قرارداد سامانه انگبین طب</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 bg-surface-container-low p-3.5 rounded-xl text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">تعرفه رسمی:</span>
                  <span className="font-bold text-primary text-sm">{formatPrice(service.basePrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">پوشش بیمه:</span>
                  <span className="font-medium text-on-surface">تامین اجتماعی، سلامت، تکمیلی</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">تسویه حساب:</span>
                  <span className="font-bold text-secondary">۱۰۰٪ پرداخت در محل</span>
                </div>
              </div>

              <Link
                href={bookUrl}
                aria-label="Book this service"
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-sm text-center transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <ClinicalIcon name="calendar_month" size={18} />
                <span>رزرو نوبت حضوری</span>
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
                <ClinicalIcon name="info" size={22} className="text-secondary" />
                <h3 className="font-bold text-base sm:text-lg text-on-surface flex items-center gap-2">
                  <span>راهنمای آمادگی مراجعه</span>
                  <span className="text-xs font-normal text-on-surface-variant/70 font-mono tracking-wide">Preparation</span>
                </h3>
              </div>
              <span className="text-xs text-on-surface-variant">
                جهت تضمین بالاترین دقت تشخیصی نتایج
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fasting Card */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                  <ClinicalIcon name="no_food" size={18} />
                  <span>
                    {fastingHours && fastingHours > 0
                      ? `${toPersianDigits(fastingHours)} ساعت ناشتایی`
                      : service.serviceType === "diagnostic" && !prep
                        ? "دستور ناشتایی ثبت نشده"
                        : "بدون نیاز به ناشتایی طولانی"}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  {fastingHours && fastingHours > 0
                    ? "شام سبک میل نموده و از نیمه‌شب از خوردن مواد قندی، چرب و غذا خودداری نمایید."
                    : service.serviceType === "diagnostic" && !prep
                      ? "برای دستور آمادگی دقیق با شماره پذیرش مرکز تماس بگیرید."
                      : "این خدمت نیازی به پرهیز از وعده‌های معمول غذایی ندارد."}
                </p>
              </div>

              {/* Water Card */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                  <ClinicalIcon name="water_drop" size={18} />
                  <span>نوشیدن آب مجاز است</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  نوشیدن آب معمولی در طول مدت پیش از مراجعه مانعی ندارد و برای رگ‌گیری توصیه می‌شود.
                </p>
              </div>

              {/* Medication Card */}
              <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs sm:text-sm">
                  <ClinicalIcon name="medication" size={18} />
                  <span>تنظیم داروها و مکمل</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  {prepText ??
                    (service.serviceType === "diagnostic"
                      ? "دستور خاصی ثبت نشده است؛ داروهای خود را طبق روال مصرف کنید مگر با نظر پزشک."
                      : "مورد خاصی برای این خدمت ثبت نشده است.")}
                </p>
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
              <ClinicalIcon name="location_on" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant">نشانی مرکز پذیرش حضوری:</span>
              {service.addressLine ? (
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">{service.addressLine}</span>
              ) : (
                <span className="text-xs text-on-surface-variant mt-0.5">نشانی ثبت نشده است.</span>
              )}
              {service.providerPhone && (
                <span className="text-xs text-primary font-medium mt-0.5">تلفن پذیرش: {service.providerPhone}</span>
              )}
            </div>
          </div>

          <Link
            href={bookUrl}
            className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-sm text-center transition-all shadow-md shrink-0"
          >
            رزرو نوبت حضوری این خدمت
          </Link>
        </div>
      </section>
    </main>
  );
}