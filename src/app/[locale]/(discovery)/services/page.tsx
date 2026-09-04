import Link from "next/link";
import { listServices } from "@/contexts/catalog/queries";
import { ServiceCard, type ServiceData } from "@/components/catalog/service-card";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

const CATEGORIES = [
  { id: "all", label: "همه خدمات", slug: "", count: "۴۸" },
  { id: "lab", label: "آزمایشگاه بالینی", slug: "laboratory", icon: "bloodtype" },
  { id: "imaging", label: "تصویربرداری", slug: "imaging", icon: "radiology" },
  { id: "inbody", label: "آنالیز ترکیب بدن", slug: "physiology", icon: "monitor_weight" },
  { id: "cardio", label: "قلب و عروق", slug: "cardiology", icon: "ecg" },
  { id: "nutrition", label: "مشاوره تغذیه", slug: "nutrition", icon: "restaurant" },
];

const FALLBACK_SERVICES: ServiceData[] = [
  {
    id: "service-metabolic-checkup",
    slug: "service-metabolic-checkup",
    name: "چکاپ جامع متابولیک و قند ناشتا",
    category: "آزمایشگاه بالینی",
    serviceType: "diagnostic",
    providerName: "آزمایشگاه پاتوبیولوژی ونک",
    description: "بررسی کامل هموگلوبین گلیکوزیله (HbA1c)، پنل لیپید، آنزیم‌های کبد و الکترولیت‌ها.",
    fastingHours: 10,
    prepInstructions: "نیازمند ۱۰ ساعت ناشتایی پیش از مراجعه",
    durationMinutes: 30,
    price: 480000,
    iconName: "bloodtype",
  },
  {
    id: "service-inbody-770",
    slug: "service-inbody-770",
    name: "آنالیز ترکیبات بدنی InBody 770",
    category: "آنالیز ترکیب بدن",
    serviceType: "diagnostic",
    providerName: "کلینیک جامع سلامت انگبین",
    description: "سنجش توده عضلانی، چربی احشایی و آب سلولی با تحلیل گزارش بالینی و تفسیر اختصاصی.",
    durationMinutes: 20,
    price: 190000,
    iconName: "monitor_weight",
    prepInstructions: "بدون نیاز به ناشتایی • مدت ارزیابی ۲۰ دقیقه",
  },
  {
    id: "svc-ecg-1",
    slug: "svc-ecg-1",
    name: "اکوکاردیوگرافی رنگی و نوار قلب (ECG)",
    category: "قلب و عروق",
    serviceType: "diagnostic",
    providerName: "مرکز قلب و کلینیک بهار (آرژانتین)",
    description: "بررسی دریچه‌ها، فشار شریان ریوی و کسر جهشی قلب به همراه تفسیر نوار قلب ۱۲ لیدی.",
    durationMinutes: 35,
    price: 620000,
    iconName: "ecg",
    prepInstructions: "پوشش بیمه تکمیلی • بدون نیاز به ناشتایی",
  },
  {
    id: "service-nutrition-consultation",
    slug: "service-nutrition-consultation",
    name: "مشاوره رژیم غذایی کبد چرب و دیابت",
    category: "مشاوره تغذیه",
    serviceType: "consultation",
    providerName: "دپارتمان بالینی انگبین",
    description: "طراحی برنامه غذایی اختصاصی بر مبنای آزمایش‌ها، شاخص مقاومت به انسولین و سفره ایرانی.",
    durationMinutes: 45,
    price: 350000,
    iconName: "restaurant",
    prepInstructions: "همراه با رژیم ۴ هفته‌ای • به همراه داشتن آزمایش خون",
  },
  {
    id: "service-ultrasound-liver",
    slug: "service-ultrasound-liver",
    name: "سونوگرافی کامل شکم و فیبرواسکن",
    category: "تصویربرداری",
    serviceType: "diagnostic",
    providerName: "مرکز تصویربرداری سپهر",
    description: "بررسی بافت کبد، کیسه صفرا، طحال، کلیه‌ها و ارزیابی فیبروز و کبد چرب.",
    fastingHours: 8,
    prepInstructions: "نیاز به ناشتایی و مثانه پر • زمان ۲۵ دقیقه",
    durationMinutes: 25,
    price: 550000,
    iconName: "radiology",
  },
  {
    id: "service-exercise-stress-test",
    slug: "service-exercise-stress-test",
    name: "تست ورزش قلبی با پایش پیوسته",
    category: "قلب و عروق",
    serviceType: "diagnostic",
    providerName: "مرکز تخصصی قلب تهران",
    description: "ارزیابی تخصصی پاسخ قلبی عروقی به فعالیت بدنی و تغییرات نوار قلب حین تمرین.",
    durationMinutes: 40,
    price: 490000,
    iconName: "directions_run",
    prepInstructions: "کفش و لباس ورزشی راحت • زمان ۴۰ دقیقه",
  },
];

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; city?: string; q?: string; fasting?: string }>;
}) {
  const { locale } = await params;
  const { category, city, q, fasting } = await searchParams;

  let dbServices: ServiceData[] = [];
  try {
    const raw = await listServices(locale, category, city);
    dbServices = raw.map((s) => ({
      id: s.id,
      name: s.name,
      providerName: s.providerName,
      serviceType: s.serviceType,
      category: s.serviceType === "diagnostic" ? "آزمایشگاه بالینی" : "خدمات درمانی",
      durationMinutes: 30,
      price: s.price ? Number(s.price) : 480000,
      slug: s.id,
      description: "بررسی و سنجش استانداردهای بالینی با تجهیزات تشخیصی پیشرفته.",
      iconName: "science",
    }));
  } catch {
    dbServices = [];
  }

  // Merge with fallback services to ensure a rich clinical catalog
  let allServices = [...dbServices];
  for (const fallback of FALLBACK_SERVICES) {
    if (!allServices.some((s) => s.id === fallback.id || s.name === fallback.name)) {
      allServices.push(fallback);
    }
  }

  // Filter by search query if present
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    allServices = allServices.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.category && s.category.toLowerCase().includes(term)) ||
        (s.providerName && s.providerName.toLowerCase().includes(term)),
    );
  }

  // Filter by fasting if requested
  if (fasting === "no-fasting") {
    allServices = allServices.filter((s) => !s.fastingHours || s.fastingHours === 0);
  }

  const currentCategory = category ?? "";

  return (
    <main className="w-full bg-surface" dir="rtl">
      {/* Top Hero / Clinical Catalog Banner */}
      <section className="relative w-full bg-surface-container-low px-4 sm:px-6 lg:px-8 py-10 overflow-hidden border-b border-outline-variant/20">
        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="flex flex-col gap-3 max-w-3xl text-right">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
              <ClinicalIcon name="verified_user" size={18} />
              <span className="text-xs sm:text-sm font-medium">تعرفه رسمی مصوب وزارت بهداشت و درمان</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-on-surface tracking-tight">
              خدمات پاراکلینیک، آزمایشگاه و سنجش بالینی
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              دسترسی مستقیم و بدون واسطه به معتبرترین مراکز تشخیصی، آزمایشگاهی و فیزیولوژی بالینی. امکان رزرو آنلاین با تضمین پرداخت حضوری در کلینیک بدون کارمزد اینترنتی.
            </p>

            {/* Trust Metric Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-on-surface text-xs sm:text-sm">
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs border border-outline-variant/20">
                <ClinicalIcon name="payments" size={18} className="text-primary" />
                <span>پرداخت ۱۰۰٪ حضوری در پذیرش</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs border border-outline-variant/20">
                <ClinicalIcon name="health_and_safety" size={18} className="text-secondary" />
                <span>طرف قرارداد بیمه‌های پایه و تکمیلی</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-2 rounded-xl shadow-xs border border-outline-variant/20">
                <ClinicalIcon name="lab_profile" size={18} className="text-primary" />
                <span>ارسال پاسخ در پرونده الکترونیک</span>
              </div>
            </div>
          </div>

          {/* Quick Status Widget */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-3 w-full lg:w-80 text-right">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-on-surface">ظرفیت‌های فعال امروز</span>
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              ۱۴ مرکز آزمایشگاهی و سونوگرافی هم‌اکنون پذیرش فوری بدون نوبت دارند.
            </p>
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-4/5"></div>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>ظرفیت پذیرش امروز</span>
              <span className="font-bold text-primary">۸۲٪ تکمیل شده</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Category Tabs Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 flex flex-col gap-4">
        {/* Category Pills Navigation */}
        <div className="w-full overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {CATEGORIES.map((cat) => {
              const isActive =
                cat.slug === currentCategory ||
                (!currentCategory && cat.id === "all");
              return (
                <Link
                  key={cat.id}
                  href={
                    cat.slug
                      ? `/${locale}/services?category=${encodeURIComponent(cat.slug)}`
                      : `/${locale}/services`
                  }
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {cat.icon && <ClinicalIcon name={cat.icon} size={16} />}
                  <span>{cat.label}</span>
                  {cat.count && (
                    <span className="bg-primary-container px-1.5 py-0.5 rounded-full text-on-primary-container text-[10px]">
                      {cat.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Search & Secondary Filter Bar */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-tier-1 border border-outline-variant/30 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <form action={`/${locale}/services`} method="GET" className="relative w-full">
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="جستجوی نام خدمت، آزمایش یا دستگاه..."
                className="w-full bg-surface-container-low rounded-xl pe-10 ps-4 py-2 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <div className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                <ClinicalIcon name="search" size={18} />
              </div>
              {category && <input type="hidden" name="category" value={category} />}
            </form>
          </div>

          {/* Fasting Toggle Link */}
          <div className="md:col-span-4 flex items-center gap-2 px-2">
            <Link
              href={
                fasting === "no-fasting"
                  ? `/${locale}/services${category ? `?category=${category}` : ""}`
                  : `/${locale}/services?fasting=no-fasting${category ? `&category=${category}` : ""}`
              }
              className={`text-xs px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
                fasting === "no-fasting"
                  ? "border-primary bg-primary/10 text-primary font-bold"
                  : "border-outline-variant/30 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <ClinicalIcon name="check_circle" size={16} />
              <span>فقط خدمات بدون نیاز به ناشتایی</span>
            </Link>
          </div>

          {/* Quick Immediate Slots Filter */}
          <div className="md:col-span-2 flex justify-end">
            <span className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-xl flex items-center gap-1 font-medium">
              <ClinicalIcon name="bolt" size={16} />
              <span>نوبت‌های امروز فعال</span>
            </span>
          </div>
        </div>
      </section>

      {/* Clinical Service Directory Cards Grid */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allServices.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              locale={locale}
              href={`/${locale}/services/${svc.slug || svc.id}`}
            />
          ))}
        </div>
      </section>

      {/* Interactive Pathway & Diagnostic Flow Banner */}
      <section className="w-full bg-surface-container-low py-10 px-4 sm:px-6 lg:px-8 mt-8 border-t border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-3 text-right max-w-2xl">
            <span className="text-xs font-bold text-secondary">فرآیند شفاف و آسان انگبین طب</span>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              چگونه نوبت خدمت پاراکلینیک خود را نهایی کنیم؟
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex flex-col gap-1 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  ۱
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-1">انتخاب خدمت و تاریخ</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  مرکز تشخیصی و ساعت مدنظر را رزرو کنید بدون کارمزد اینترنتی.
                </p>
              </div>
              <div className="flex flex-col gap-1 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  ۲
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-1">دریافت پیامک آمادگی</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  دستورات ناشتایی یا پیش‌نیازهای آزمایش بلافاصله پیامک می‌گردد.
                </p>
              </div>
              <div className="flex flex-col gap-1 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
                <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  ۳
                </div>
                <span className="text-xs sm:text-sm font-bold text-on-surface mt-1">مراجعه و پرداخت در محل</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  تسویه با بیمه در پذیرش مرکز و بارگذاری جواب در سامانه پرونده.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 w-full md:w-80 text-right flex flex-col gap-3">
            <div className="flex items-center gap-2 text-primary">
              <ClinicalIcon name="support_agent" size={24} />
              <span className="text-sm font-bold">پاسخگویی به سوالات تشخیصی</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              نیاز به راهنمایی در مورد نسخه پزشک یا تداخل آزمایش‌ها دارید؟ کارشناسان بالینی انگبین طب آماده مشاوره هستند.
            </p>
            <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">خط مستقیم پشتیبانی:</span>
              <span className="font-bold text-on-surface tracking-wider">۰۲۱-۸۸۲۲۴۰۰۰</span>
            </div>
            <a
              href="tel:02188224000"
              className="bg-secondary hover:bg-secondary/90 text-on-secondary py-2.5 rounded-xl text-xs font-medium transition-colors text-center shadow-xs"
            >
              تماس با کارشناس آزمایشگاهی
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}