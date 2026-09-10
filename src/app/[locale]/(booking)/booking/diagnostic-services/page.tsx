import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PendingLink } from "@/components/clinical/pending-link";
import { PendingSubmit } from "@/components/clinical/pending-submit";
import { listServices } from "@/contexts/catalog/queries";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bone,
  BriefcaseMedical,
  CalendarDays,
  FlaskConical,
  HeartPulse,
  Info,
  ListChecks,
  Scan,
  Search,
  type LucideIcon,
} from "lucide-react";
import { formatPrice } from "@/lib/format";

interface DiagnosticCategory {
  id: string;
  nameFa: string;
  nameEn: string;
  nameAr: string;
  icon: LucideIcon;
  descFa: string;
  descEn: string;
  descAr: string;
  fastingNoteFa: string;
  fastingNoteEn: string;
  fastingNoteAr: string;
  avgDurationFa: string;
  avgDurationEn: string;
  avgDurationAr: string;
}

const DIAGNOSTIC_CATEGORIES: DiagnosticCategory[] = [
  {
    id: "laboratory",
    nameFa: "آزمایشگاه بالینی و پاتولوژی",
    nameEn: "Clinical Laboratory & Pathology",
    nameAr: "المختبر السريري وعلم الأمراض",
    icon: FlaskConical,
    descFa: "آزمایش‌های خون، بیوشیمی، هورمونی، ایمونولوژی و بررسی‌های غربالگری بالینی",
    descEn: "Blood tests, biochemistry, hormonal profiles, immunology, and clinical health screenings.",
    descAr: "تحاليل الدم، الكيمياء الحيوية، الهرمونات، المناعة والفحوصات الدورية الشاملة",
    fastingNoteFa: "نیاز به ۱۰ الی ۱۲ ساعت ناشتایی کامل دارد",
    fastingNoteEn: "Requires 10-12 hours of complete fasting",
    fastingNoteAr: "يتطلب صياماً كاملاً لمدة ١٠ إلى ١٢ ساعة",
    avgDurationFa: "۲۰ دقیقه",
    avgDurationEn: "20 min",
    avgDurationAr: "٢٠ دقيقة",
  },
  {
    id: "ultrasound",
    nameFa: "سونوگرافی و کالر داپلر",
    nameEn: "Ultrasound & Color Doppler",
    nameAr: "الموجات فوق الصوتية والدوبلر الملون",
    icon: Scan,
    descFa: "سونوگرافی شکم و لگن، تیروئید، برست، بارداری، عروق و ارگان‌های داخلی",
    descEn: "Abdominal, pelvic, thyroid, breast, pregnancy, and vascular Doppler ultrasound.",
    descAr: "سونار البطن والحوض، الغدة الدرقية، الثدي، متابعة الحمل والأوعية الدموية",
    fastingNoteFa: "نیاز به پر بودن مثانه یا ۶ ساعت ناشتایی بر حسب ناحیه",
    fastingNoteEn: "Requires full bladder or 6-hour fasting depending on target organ",
    fastingNoteAr: "يتطلب امتلاء المثانة أو ٦ ساعات صيام حسب المنطقة المستهدفة",
    avgDurationFa: "۳۰ دقیقه",
    avgDurationEn: "30 min",
    avgDurationAr: "٣٠ دقيقة",
  },
  {
    id: "radiology",
    nameFa: "رادیولوژی دیجیتال و سنجش تراکم استخوان",
    nameEn: "Digital Radiology & Bone Density",
    nameAr: "الأشعة الرقمية وقياس كثافة العظام",
    icon: Bone,
    descFa: "تصویربرداری تخصصی از قفسه سینه، ستون فقرات، مفاصل و اسکن دگزا",
    descEn: "Specialized X-rays for chest, spine, joints, and DEXA bone density scan.",
    descAr: "تصوير تخصصي للصدر، العمود الفقري، المفاصل وفحص هشاشة العظام (DEXA)",
    fastingNoteFa: "عدم استفاده از البسه با زیپ و دکمه فلزی",
    fastingNoteEn: "Avoid clothing with metal zippers or buttons",
    fastingNoteAr: "تجنب ارتداء ملابس تحتوي على سحابات أو أزرار معدنية",
    avgDurationFa: "۱۵ دقیقه",
    avgDurationEn: "15 min",
    avgDurationAr: "١٥ دقيقة",
  },
  {
    id: "endoscopy",
    nameFa: "آندوسکوپی و کولونوسکوپی",
    nameEn: "Endoscopy & Colonoscopy",
    nameAr: "تنظير الجهاز الهضمي والقولون",
    icon: BriefcaseMedical,
    descFa: "بررسی مستقیم مخاط دستگاه گوارش، بیوپسی و غربالگری گوارشی تحت سدیشن",
    descEn: "Direct endoscopic inspection of digestive tract, biopsy, and screening under sedation.",
    descAr: "فحص مباشر للغشاء المخاطي الهضمي، أخذ خزعات وفحص القولون تحت التخدير الخفيف",
    fastingNoteFa: "نیاز به مصرف داروهای مسهل تجویزی و ناشتایی ۱۲ ساعته",
    fastingNoteEn: "Requires prescribed bowel prep and 12-hour complete fasting",
    fastingNoteAr: "يتطلب تناول الملينات الموصوفة والصيام التام لمدة ١٢ ساعة",
    avgDurationFa: "۴۵ دقیقه",
    avgDurationEn: "45 min",
    avgDurationAr: "٤٥ دقيقة",
  },
  {
    id: "cardio-diag",
    nameFa: "اکوکاردیوگرافی و تست ورزش",
    nameEn: "Echocardiography & Stress Test",
    nameAr: "تخطيط صدى القلب واختبار الجهد",
    icon: HeartPulse,
    descFa: "اکو با داپلر بافتی، هولتر ریتم ۲۴ ساعته، هولتر فشار خون و ارزیابی عروق کرونر",
    descEn: "Echocardiography, 24h rhythm Holter, BP Holter, and coronary assessment.",
    descAr: "إيكو دوبلر ملون، هولتر نبض ٢٤ ساعة، هولتر ضغط الدم وفحص الشرايين التاجية",
    fastingNoteFa: "پوشیدن لباس راحت و عدم استعمال دخانیات ۳ ساعت قبل",
    fastingNoteEn: "Wear comfortable athletic clothing; refrain from smoking 3h prior",
    fastingNoteAr: "ارتداء ملابس مريحة والامتناع التام عن التدخين قبل ٣ ساعات",
    avgDurationFa: "۳۵ دقیقه",
    avgDurationEn: "35 min",
    avgDurationAr: "٣٥ دقيقة",
  },
  {
    id: "mri-ct",
    nameFa: "سی‌تی اسکن و ام‌آر‌آی (MRI)",
    nameEn: "CT Scan & MRI",
    nameAr: "الأشعة المقطعية والرنين المغناطيسي (MRI)",
    icon: Activity,
    descFa: "تصویربرداری مقطعی با و بدون تزریق ماده حاجب با دستگاه‌های پیشرفته ۱.۵ تسلا",
    descEn: "High-resolution cross-sectional imaging with/without contrast on 1.5T scanners.",
    descAr: "تصوير مقطعي عالي الدقة مع أو بدون حقن الصبغة بأجهزة ١.٥ تسلا المتطورة",
    fastingNoteFa: "در صورت نیاز به تزریق حاجب، ناشتایی ۴ ساعته الزامی است",
    fastingNoteEn: "If IV contrast is indicated, 4-hour fasting is mandatory",
    fastingNoteAr: "في حال تطلب الأمر حقن صبغة، يلزم الصيام لمدة ٤ ساعات",
    avgDurationFa: "۴۰ دقیقه",
    avgDurationEn: "40 min",
    avgDurationAr: "٤٠ دقيقة",
  },
];

export default async function DiagnosticServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const t = await getTranslations("booking");
  const tCommon = await getTranslations("common");
  const ts = await getTranslations("states");
  const dir = locale === "en" ? "ltr" : "rtl";
  const ForwardArrow = locale === "en" ? ArrowRight : ArrowLeft;

  let services: any[] = [];
  try {
    const res = await listServices(locale, undefined, undefined, 1, 20);
    services = res.rows;
  } catch {
    services = [];
  }

  const query = (q ?? "").trim().toLowerCase();
  const filteredCategories = DIAGNOSTIC_CATEGORIES.filter((c) => {
    if (!query) return true;
    return (
      c.nameFa.toLowerCase().includes(query) ||
      c.nameEn.toLowerCase().includes(query) ||
      c.nameAr.toLowerCase().includes(query) ||
      c.descFa.toLowerCase().includes(query) ||
      c.descEn.toLowerCase().includes(query) ||
      c.descAr.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col w-full bg-surface min-h-screen" dir={dir}>
      {/* Breadcrumbs */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              {t("crumbHome")}
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-on-surface font-bold">
              {t("diagnostic.title")}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <BadgeCheck size={16} aria-hidden="true" />
            {t("diagnostic.badge")}
          </span>
        </div>
      </div>

      {/* Header Banner */}
      <section className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 via-surface to-surface py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
            {t("diagnostic.heroTitle")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed mb-8">
            {t("diagnostic.heroDesc")}
          </p>

          {/* Search Bar */}
          <form
            method="GET"
            className="max-w-lg mx-auto relative flex items-center bg-surface-container-lowest rounded-2xl shadow-tier-2 border border-outline-variant/40 p-2"
          >
            <Search
              size={22}
              className="text-on-surface-variant ms-3 shrink-0"
              aria-hidden="true"
            />
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder={t("diagnostic.searchPh")}
              className="w-full bg-transparent px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none"
            />
            {q && (
              <PendingLink
                href={`/${locale}/booking/diagnostic-services`}
                busyLabel={ts("loading")}
                className="text-xs text-on-surface-variant hover:text-error px-2 py-1"
              >
                {t("clearSearch")}
              </PendingLink>
            )}
            <PendingSubmit
              className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              {tCommon("search")}
            </PendingSubmit>
          </form>
        </div>
      </section>

      {/* Main Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
            <FlaskConical size={24} className="text-primary" aria-hidden="true" />
            <span>{t("diagnostic.deptTitle")}</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => {
            const CatIcon = cat.icon;
            const name =
              locale === "ar" ? cat.nameAr : locale === "en" ? cat.nameEn : cat.nameFa;
            const desc =
              locale === "ar" ? cat.descAr : locale === "en" ? cat.descEn : cat.descFa;
            const fasting =
              locale === "ar"
                ? cat.fastingNoteAr
                : locale === "en"
                  ? cat.fastingNoteEn
                  : cat.fastingNoteFa;
            const duration =
              locale === "ar"
                ? cat.avgDurationAr
                : locale === "en"
                  ? cat.avgDurationEn
                  : cat.avgDurationFa;

            return (
              <div
                key={cat.id}
                className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 border border-outline-variant/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <CatIcon size={28} aria-hidden="true" />
                    </div>
                    <span className="text-[11px] bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full font-medium">
                      {t("diagnostic.duration", { duration })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-on-surface mb-1">
                    {name}
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    {desc}
                  </p>

                  {/* Prep note warning badge */}
                  <div className="p-3 rounded-xl bg-secondary-container/20 border border-secondary/20 flex items-start gap-2 text-xs text-secondary mb-4">
                    <Info size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex flex-col">
                      <span className="font-bold">
                        {t("diagnostic.prepNote")}
                      </span>
                      <span className="text-[11px] mt-0.5">{fasting}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/${locale}/services`}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-4 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>
                    {t("diagnostic.bookCta")}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Available Bookable Services Table */}
      {services.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="bg-surface-container-low p-6 sm:p-8 rounded-3xl border border-outline-variant/30">
            <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
              <ListChecks size={22} className="text-primary" aria-hidden="true" />
              <span>{t("diagnostic.activePkgs")}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.slice(0, 6).map((svc) => (
                <div
                  key={svc.id}
                  className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{svc.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{svc.providerName}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 text-xs">
                    <span className="font-bold text-primary">
                      {svc.price
                        ? formatPrice(svc.price, locale)
                        : t("diagnostic.tariffBadge")}
                    </span>
                    <Link
                      href={`/${locale}/services/${svc.id}/book`}
                      className="text-primary hover:underline font-bold flex items-center gap-1"
                    >
                      <span>{t("diagnostic.book")}</span>
                      <ForwardArrow size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
