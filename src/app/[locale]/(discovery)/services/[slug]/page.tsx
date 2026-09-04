import Link from "next/link";
import { getService, getPrepInfo } from "@/contexts/catalog/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits, formatPrice } from "@/components/catalog/doctor-card";

const SAMPLE_SERVICES: Record<string, {
  name: string;
  providerName: string;
  serviceType: string;
  durationMinutes: number;
  basePrice: number;
  description: string;
  fastingHours: number;
  prepInstructions: string;
  addressLine: string;
  phone: string;
}> = {
  "service-metabolic-checkup": {
    name: "چکاپ جامع متابولیک، مقاومت به انسولین و سلامت کبد",
    providerName: "آزمایشگاه پاتوبیولوژی ونک",
    serviceType: "diagnostic",
    durationMinutes: 30,
    basePrice: 480000,
    description: "بررسی سیستمیک عملکرد غدد اندوکرین، سندرم متابولیک، پایش درجه مقاومت به انسولین با روش HOMA-IR و غربالگری دقیق استئاتوزیس کبد (کبد چرب)، به انضمام بررسی پروفایل چربی و بیومارکرهای ویتامینی ضروری بدن.",
    fastingHours: 10,
    prepInstructions: "۱۰ الی ۱۲ ساعت ناشتایی پیش از مراجعه الزامی است. نوشیدن آب مجاز بوده و مصرف داروهای غیرضروری به بعد از آزمایش موکول شود.",
    addressLine: "تهران، خیابان ملاصدرا، نرسیده به میدان ونک، پلاک ۴۲، طبقه همکف، کلینیک جامع سلامت انگبین",
    phone: "۰۲۱-۸۸۲۲۴۱۱۵",
  },
  "svc-ecg-1": {
    name: "اکوکاردیوگرافی رنگی و نوار قلب (ECG)",
    providerName: "مرکز قلب و کلینیک بهار",
    serviceType: "diagnostic",
    durationMinutes: 35,
    basePrice: 620000,
    description: "بررسی ساختار دریچه‌ها، فشار شریان ریوی و کسر جهشی قلب به همراه ثبت و تفسیر نوار قلب ۱۲ لیدی توسط متخصص قلب و عروق.",
    fastingHours: 0,
    prepInstructions: "بدون نیاز به ناشتایی. لطفاً در صورت مصرف داروهای تنظیم ریتم یا فشار خون، مدارک قبلی را همراه داشته باشید.",
    addressLine: "تهران، میدان آرژانتین، خیابان الوند، مرکز قلب و کلینیک بهار",
    phone: "۰۲۱-۸۸۷۹۳۴۰۰",
  },
  "service-inbody-770": {
    name: "آنالیز ترکیبات بدنی InBody 770",
    providerName: "کلینیک جامع سلامت انگبین",
    serviceType: "diagnostic",
    durationMinutes: 20,
    basePrice: 190000,
    description: "سنجش توده عضلانی تفکیکی، چربی احشایی و آب سلولی با تحلیل گزارش بالینی توسط کارشناس فیزیولوژی.",
    fastingHours: 2,
    prepInstructions: "حداقل ۲ ساعت قبل از آزمون از مصرف مایعات فراوان و فعالیت ورزشی شدید خودداری فرمایید.",
    addressLine: "تهران، میدان ونک، خیابان ملاصدرا، پلاک ۴۲",
    phone: "۰۲۱-۸۸۲۲۴۱۱۵",
  },
};

const LAB_PARAMETERS = [
  { name: "قند خون ناشتا", code: "FBS", target: "سنجش پایه سطح گلوکز ناشتا و غربالگری دیابت", method: "Glucose Oxidase (GOD-PAP)", status: "کمی + نمودار" },
  { name: "هموگلوبین گلیکوزیله", code: "HbA1c", target: "میانگین غلظت قند متصل به گلبول‌های قرمز در ۹۰ روز گذشته", method: "HPLC استاندارد NGSP", status: "کمی + تحلیل ریسک" },
  { name: "شاخص مقاومت به انسولین", code: "HOMA-IR / Fasting Insulin", target: "محاسبه نسبت انسولین به قند جهت کشف مقاومت سلولی پنهان", method: "ECLIA", status: "شاخص ویژه" },
  { name: "پنل کامل چربی خون", code: "Chol / HDL / LDL / TG", target: "پایش ریسک آترواسکلروز عروقی و کبد چرب", method: "Colorimetric", status: "کمی با نسبت چربی" },
  { name: "آنزیم‌های سیتوپلاسمی کبد", code: "SGOT (AST) & SGPT (ALT)", target: "نشانگرهای التهاب سلول‌های کبدی و ارزیابی آسیب یا استئاتوهپاتیت", method: "IFCC Kinetic", status: "کمی" },
  { name: "ویتامین D3 بالینی", code: "25-OH Vitamin D3", target: "همبستگی مستقیم با حساسیت سلولی به انسولین و ایمنی عمومی", method: "CLIA", status: "کمی با دامنه بهینه" },
];

export default async function ServicePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  let dbService = null;
  try {
    dbService = await getService(slug, locale);
  } catch {
    dbService = null;
  }

  const sample = SAMPLE_SERVICES[slug] ?? SAMPLE_SERVICES["service-metabolic-checkup"];

  const service = {
    id: dbService?.id ?? slug,
    name: dbService?.name ?? sample.name,
    providerName: dbService?.providerName ?? sample.providerName,
    serviceType: dbService?.serviceType ?? sample.serviceType,
    durationMinutes: dbService?.durationMinutes ?? sample.durationMinutes,
    basePrice: dbService?.basePrice ? Number(dbService.basePrice) : sample.basePrice,
    description: sample.description,
    addressLine: dbService?.addressLine ?? sample.addressLine,
    phone: sample.phone,
  };

  let prep = null;
  if (service.serviceType === "diagnostic") {
    try {
      prep = await getPrepInfo(service.id);
    } catch {
      prep = null;
    }
  }

  const fastingHours = prep?.fastingHours ?? sample.fastingHours;
  const prepText = prep?.prepInstructions ?? sample.prepInstructions;
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

              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed text-justify">
                {service.description}
              </p>

              {/* Key Metrics Bento Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-right">
                  <ClinicalIcon name="timer" size={22} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">زمان انجام</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    {toPersianDigits(service.durationMinutes)} دقیقه
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-right">
                  <ClinicalIcon name="cloud_done" size={22} className="text-secondary" />
                  <span className="text-xs text-on-surface-variant">تحویل نتیجه</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    ۲۴ ساعته آنلاین
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-right">
                  <ClinicalIcon name="payments" size={22} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">تعرفه مصوب وزارت بهداشت</span>
                  <span className="text-sm sm:text-base font-bold text-primary">
                    {formatPrice(service.basePrice)}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-4 rounded-xl shadow-xs border border-outline-variant/20 flex flex-col gap-1 text-right">
                  <ClinicalIcon name="credit_card_off" size={22} className="text-primary" />
                  <span className="text-xs text-on-surface-variant">شیوه پرداخت</span>
                  <span className="text-sm sm:text-base font-bold text-on-surface">
                    حضوری در مرکز (پرداخت در مطب)
                  </span>
                </div>
              </div>
            </div>

            {/* Credential & Quick Booking Card (4 Cols) */}
            <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-2xl shadow-tier-2 border border-outline-variant/30 flex flex-col gap-4 text-right">
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
                <span>رزرو آنلاین نوبت (Book this service)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* High-Visibility Patient Preparation Warning Box */}
      <section className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4 text-right">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ClinicalIcon name="info" size={22} className="text-secondary" />
                <h3 className="font-bold text-base sm:text-lg text-on-surface">
                  راهنمای آمادگی قبل از خدمت (Preparation)
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
                      : "بدون نیاز به ناشتایی طولانی"}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  {fastingHours && fastingHours > 0
                    ? "شام سبک میل نموده و از نیمه‌شب از خوردن مواد قندی، چرب و غذا خودداری نمایید."
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
                  {prepText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete Laboratory Panel Table */}
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-surface-container-low border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 text-right">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-primary">فهرست ریزفاکتورهای تحلیلی</span>
            <h2 className="text-lg sm:text-xl font-bold text-on-surface">
              پارامترهای مورد سنجش در این بسته بالینی
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              تمام آزمایش‌ها مطابق استانداردهای بالینی با نمونه تازه و معرف‌های دارای تاییدیه معتبر انجام می‌شوند.
            </p>
          </div>

          {/* Data Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-tier-1 border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-surface-container font-bold text-on-surface border-b border-outline-variant/20">
                    <th className="py-3 px-4">نام پارامتر بالینی</th>
                    <th className="py-3 px-4">نماد اختصاری</th>
                    <th className="py-3 px-4">هدف تشخیصی</th>
                    <th className="py-3 px-4">روش سنجش</th>
                    <th className="py-3 px-4 text-center">وضعیت گزارش</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {LAB_PARAMETERS.map((param, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-on-surface">{param.name}</td>
                      <td className="py-3 px-4 font-mono text-primary font-bold">{param.code}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{param.target}</td>
                      <td className="py-3 px-4 text-on-surface-variant">{param.method}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                          {param.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Direct CTA Bar */}
      <section className="w-full py-8 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-tier-1">
          <div className="flex items-center gap-3 text-right">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <ClinicalIcon name="location_on" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-on-surface-variant">نشانی مرکز پذیرش حضوری:</span>
              <span className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">{service.addressLine}</span>
              <span className="text-xs text-primary font-medium mt-0.5">تلفن پذیرش: {service.phone}</span>
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