import Link from "next/link";
import { UniversalSearchBar } from "@/components/clinical/universal-search-bar";
import { DoctorCard, type DoctorData } from "@/components/catalog/doctor-card";
import { ServiceCard, type ServiceData } from "@/components/catalog/service-card";
import { MetabolismCalculator } from "@/components/clinical/metabolism-calculator";
import {
  ArticleCard,
  VideoCard,
  type ArticleData,
  type VideoData,
} from "@/components/clinical/media-cards";
import { TrustMetrics } from "@/components/clinical/trust-metrics";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

const FEATURED_DOCTORS: DoctorData[] = [
  {
    id: "dr-leila-sadat",
    slug: "dr-leila-sadat",
    name: "دکتر لیلا سادات",
    specialty: "فوق تخصص غدد و متابولیسم",
    academicTitle: "عضو هیئت علمی دانشگاه",
    medicalCouncilCode: "38921",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgLHqpdLwi6gKxX4wuTHNQznIImyMJTWAKQWoKKdpyMPZCB-f0hzxodxU2ohqzasdkAcYQLw9m3dPjKTVWpOd-DYOHQt3yvdS0I4SMzfzSEzZgjJm6d0As7zrfsFoqPsPCUk6wJ-Ba3VQTtKBv3E2UAreQZI94OfS3FZ3ftVtdDQb-ewEEf5xjHVlLi-_1g2hc_KRok_uNm8wlyEJiazTNLUWTQWeaSxFg0ReNg9_-ittHh8IqYVcV",
    rating: 4.9,
    reviewsCount: 240,
    nextSlot: "فردا ساعت ۱۰:۳۰",
    clinicAddress: "کلینیک تخصصی ونک، تهران",
    fee: 250000,
    isVerified: true,
  },
  {
    id: "dr-arash-radmanesh",
    slug: "dr-arash-radmanesh",
    name: "دکتر آرش رادمنش",
    specialty: "متخصص تغذیه بالینی و رژیم‌درمانی",
    academicTitle: "فلوشیپ چاقی و متابولیک",
    medicalCouncilCode: "45120",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdWGbdCN3f5b2WRWxNcX-tm1xAvJ4a2OO5TVjg3BhQxrWvFp6O53ZTYIrSITla_89ZeERTcCMnW5umXyYPQaENjqhxi9j5NB8ybPjl14gCquQoHqm1izNaBrwwWungtgAsB5DYMblthDADLKb3u5dRfrWSJqlPSa5bWmTzNNtSPq_faQ-rIjlZecYtwGNLbGrMXw7z5I4bFu78vgQyuaO-RHQXuIzq822StTQbYzTJwmiD6GU0_Zqe",
    rating: 5.0,
    reviewsCount: 185,
    nextSlot: "یکشنبه ساعت ۱۶:۰۰",
    clinicAddress: "بیمارستان و کلینیک پارس",
    fee: 220000,
    isVerified: true,
  },
  {
    id: "dr-sara-mahdavi",
    slug: "dr-sara-mahdavi",
    name: "دکتر سارا مهدوی",
    specialty: "متخصص قلب، عروق و اکوکاردیوگرافی",
    academicTitle: "بورد تخصصی قلب و عروق",
    medicalCouncilCode: "51874",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4hmQq4mBeIHIWpk7YkO4OJUUJcm5DSyPABVetMD7_gPH9amJFg4Qq7y_oYd8mViOgeVZeuZUr0XjQjlMlsvHnZFlAKsSGMv83qWApQGVIfwNowq2ZRRbF-j0c7n6SoBh7jbIbj_xsLBofCVWT_xwUjq4mvRpNZnImcWV4YhmpZy93uAIW5kYhnP4xXHPjJsGt7NJsPTLW9uh6h75C5UhNZmem24bYZtKXdTCONI0Y-TZ7ia5jSe4A",
    rating: 4.8,
    reviewsCount: 310,
    nextSlot: "دوشنبه ساعت ۱۱:۱۵",
    clinicAddress: "مرکز قلب و کلینیک بهار",
    fee: 260000,
    isVerified: true,
  },
  {
    id: "dr-payam-bahrami",
    slug: "dr-payam-bahrami",
    name: "دکتر پیام بهرامی",
    specialty: "فوق تخصص بیماری‌های گوارش و کبد",
    academicTitle: "عضو انجمن گوارش ایران",
    medicalCouncilCode: "29410",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAB0esi-S2ulnr1aewLITrOTzIebt9gUwo8bsISUfYqFiKONKUibrkY53V97pBbU6I_SgnK-Z9A6y5a7U1FUc5MTweuEGnmqaG7Sc2wDgMVfgInB-jlQRP2YFJFGZgn8DTREeH-8wH9qe3oBca_2BqR4-AhznDFyHXww5G7QUJbp6ppUfxRHQWwLTywjTNCuv6RuVUCYtbBrrwAgW9ddWWCR9k0FZJmBVHdPFEASatoyES8vNDBXCXx",
    rating: 4.9,
    reviewsCount: 192,
    nextSlot: "سه‌شنبه ساعت ۱۸:۳۰",
    clinicAddress: "کلینیک تخصصی سعادت‌آباد",
    fee: 270000,
    isVerified: true,
  },
];

const FEATURED_SERVICES: ServiceData[] = [
  {
    id: "service-metabolic-checkup",
    slug: "service-metabolic-checkup",
    name: "چکاپ جامع متابولیک و قند ناشتا",
    category: "آزمایشگاه جامع",
    description: "شامل HbA1c، چربی کامل، آنزیم‌های کبد و ارزیابی مقاومت به انسولین.",
    fastingHours: 10,
    prepInstructions: "نیازمند ۱۰ ساعت ناشتایی پیش از مراجعه",
    durationMinutes: 30,
    price: 480000,
    iconName: "water_drop",
  },
  {
    id: "service-inbody-770",
    slug: "service-inbody-770",
    name: "ارزیابی بادی کامپوزیشن (InBody 770)",
    category: "آنالیز ترکیب بدن",
    description:
      "محاسبه درصد چربی احشایی، آب میان‌بافتی، جرم عضلانی و تقارن اسکلتی با دستگاه InBody 770.",
    durationMinutes: 20,
    price: 190000,
    iconName: "monitor_weight",
  },
  {
    id: "service-nutrition-consultation",
    slug: "service-nutrition-consultation",
    name: "مشاوره بالینی تغذیه",
    category: "کلینیک تغذیه",
    description: "تنظیم رژیم منطبق با سفره غذایی خانواده ایرانی و تحلیل پرونده بیوشیمی.",
    prepInstructions: "به همراه داشتن آخرین برگه آزمایش خون",
    durationMinutes: 45,
    price: 350000,
    iconName: "restaurant",
  },
  {
    id: "service-echocardiography",
    slug: "service-echocardiography",
    name: "اکوکاردیوگرافی داپلر و نوار قلب",
    category: "قلب و عروق",
    description: "بررسی دریچه‌ها، فشار شریان ریوی و انقباض بطن با دستگاه تصویربرداری پیشرفته.",
    prepInstructions: "تحت پوشش بیمه‌های پایه و تکمیلی",
    durationMinutes: 35,
    price: 620000,
    iconName: "ecg",
  },
];

const FEATURED_ARTICLES: ArticleData[] = [
  {
    id: "article-fatty-liver",
    slug: "article-fatty-liver",
    title: "راهنمای بالینی کنترل کبد چرب گرید ۱ و ۲ با اصلاح سفره غذایی ایرانی",
    summary:
      "چگونه بدون حذف کامل نان و برنج سنتی و با جایگزینی چربی‌های غیراشباع و ادویه‌های ضدالتهابی مانند زردچوبه و سماق، آنزیم‌های کبد را نرمال کنیم؟",
    authorName: "دکتر پیام بهرامی",
    readingTimeMinutes: 6,
    category: "گوارش و کبد",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDePO_5NOil5hBw1BsUSMJU6luV71T7sMSugcRjMPA-keQnfsk_1ScIqF74ntRiUdIWT56K09Lwz49pPjk6gPjmEGCX1p_zXO_0MnzTiFMeT52CVRV_r78gdh0aI1Z2f_DvHSFDk7vcoK-u18Pr_ht8Q-Baspbyh0vvQgxwfFWAdQ0tOcGBxVcb-X08JklJjZQ9hx3Oxc23cuXTocMfOaQznM4tqFNMaUpeppuoxLgClOwpqHa1eoh2",
  },
  {
    id: "article-persian-rice-calories",
    slug: "article-persian-rice-calories",
    title: "چگونه کالری پلوهای سنتی (کته، ته‌چین و شویدپلو) را دقیق ثبت کنیم؟",
    summary:
      "بررسی وزن دقیق هر کفگیر استاندارد پلو، محاسبه اثر روغن ته‌دیگ بر گلایسمیک ایندکس غذا، و تکنیک‌های ثبت سریع در دفترچه کالری‌شمار انگبین.",
    authorName: "دکتر آرش رادمنش",
    readingTimeMinutes: 4,
    category: "کالری‌شماری بومی",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBFi68Nxfnudc9m9zVFfxJrE3N2YO-lUAex71hxH9FItlhf7RaJa01RuEQUuUTOtM85SLlbarUw8JjrTwRLL4tiAATZzkmbz_ieqxA2qdSMloY2umrLPfCOf7XG6z8AV0rUgYmL1WWGeiaOmYVy0RVUD6Ddzhm8ApghDXkKE_bkETK2zVgGboEeW2_epxJ5SFer8_pWmeMDDxNz-7I45B-iegunhCJgBQa_Ipi50iuL1OTPh0FAusVo",
  },
];

const FEATURED_VIDEO: VideoData = {
  id: "video-insulin-resistance",
  slug: "video-insulin-resistance",
  title: "نشانه‌های اولیه مقاومت به انسولین چیست؟ راهکارهای مداخله زودهنگام",
  summary:
    "تحلیل علائم پوستی، خستگی پس از صرف ناهار پرکربوهیدرات و چگونگی پیشگیری از تبدیل پیش‌دیابت به دیابت آشکار در مصاحبه ویدئویی.",
  speakerName: "دکتر لیلا سادات",
  durationMinutes: 8,
  durationLabel: "۰۸:۴۵",
  category: "ویدیو پزشکی",
  thumbnailUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBAv6WkVP2XauilASeHo8iOfQKma6Il3ULG5ACCyBXBYnrajyIkH1ei95M4ebGkehKlKv0SJ1kW_vDX_Zf93t7bYyTAtBr6T14YQQ6Vs84hA5-Vsk8BdI-r_ZZAz5azHq_gw5dqMaTVy2xV_zbiQ2E3JTONAJj1rg3K_-cKxjY-tU2bsPi_IohU9I0SmuW2nXsNsTq1AIB1KpDZ5jXSrJXlZEJvGStjCFmeUvx-YlLzSCfvKGk9oq4v",
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const quickActions = [
    {
      title: "نوبت‌دهی پزشکان",
      href: `/${locale}/doctors`,
      icon: "stethoscope",
      description: "مشاهده تقویم کاری پزشکان متخصص و رزرو ۱۰۰٪ رایگان با پرداخت در مطب.",
      cta: "انتخاب پزشک",
    },
    {
      title: "خدمات پاراکلینیک",
      href: `/${locale}/services`,
      icon: "science",
      description:
        "آزمایشگاه، سونوگرافی، نوار عصب و فیزیوتراپی به همراه راهنمای آمادگی قبل از مراجعه.",
      cta: "فهرست مراکز",
    },
    {
      title: "سنجش سوخت‌وساز",
      href: "#metabolism-section",
      icon: "calculate",
      description:
        "محاسبه آنلاین شاخص‌های فیزیولوژیک BMR و TDEE مطابق فرمول اعتبارسنجی میفلین.",
      cta: "محاسبه سریع",
    },
    {
      title: "دفترچه کالری‌شمار",
      href: `/${locale}/nutrition/diary`,
      icon: "restaurant",
      description:
        "ثبت وعده‌ها با مقیاس‌های دقیق بومی: کفگیر برنج، پیاله ماست، قاشق روغن حیوانی.",
      cta: "ثبت سفره امروز",
    },
    {
      title: "رژیم‌درمانی تخصصی",
      href: `/${locale}/nutrition/diet`,
      icon: "spa",
      description:
        "رژیم‌های تاییدشده پزشکی برای کبد چرب، نقرس، پرفشاری خون و سلامت کارمندی.",
      cta: "مشاهده پروتکل‌ها",
    },
  ];

  return (
    <div className="flex flex-col w-full bg-surface" dir="rtl">
      {/* 1. Ambient Hero Section */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-primary/10 via-surface to-surface">
        {/* Ambient Glows */}
        <div className="absolute -top-40 end-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 start-10 w-80 h-80 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none" />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-12 sm:pb-16 w-full text-center relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 bg-surface-container-low px-4 py-1.5 rounded-full mb-5 border border-outline-variant/30 shadow-xs">
              <ClinicalIcon
                name="health_and_safety"
                size={20}
                className="text-primary"
              />
              <span className="text-xs sm:text-sm font-bold text-primary">
                سامانه یکپارچه سلامت، درمان و تغذیه بالینی
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4 leading-tight sm:leading-snug">
              مسیر هوشمند پایش سلامت و نوبت‌دهی معتبرترین پزشکان متخصص
            </h1>

            {/* Subheading */}
            <p className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-3xl mb-8 leading-relaxed">
              تجمیع خدمات بالینی، پاراکلینیک، سنجش متابولیسم و مشاوره‌های تخصصی تغذیه بر اساس الگوهای بومی ایران، بدون کارمزد آنلاین و با پرداخت در مطب.
            </p>

            {/* Universal Search Bar */}
            <UniversalSearchBar locale={locale} />
          </div>
        </section>
      </div>

      {/* 2. 5-Fold Quick Action Feature Cards */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label="سامانه‌های یکپارچه سلامت انگبین"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <div>
            <span className="text-xs sm:text-sm font-bold text-secondary block mb-1">
              دسترسی سریع بیماران و مراجعان
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              سامانه‌های یکپارچه سلامت انگبین
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-on-surface-variant">
            انتخاب سریع مسیر درمان و پایش شخصی
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              href={action.href}
              className="group flex flex-col justify-between bg-surface-container-lowest p-4 sm:p-5 rounded-2xl shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 hover:-translate-y-1 text-start border border-outline-variant/30"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3.5 group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                  <ClinicalIcon name={action.icon} size={26} />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-on-surface mb-1.5">
                  {action.title}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {action.description}
                </p>
              </div>
              <div className="mt-4 pt-2 flex items-center text-primary text-xs font-bold gap-1 group-hover:gap-1.5 transition-all border-t border-outline-variant/15">
                <span>{action.cta}</span>
                <ClinicalIcon name="arrow_back" size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Specialists Grid */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label="پزشکان معتمد انگبین طب"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div className="text-start">
            <div className="flex items-center gap-1.5 mb-1 text-primary">
              <ClinicalIcon name="stethoscope" size={18} />
              <span className="text-xs sm:text-sm font-bold">
                پزشکان معتمد انگبین طب
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              نوبت‌های آماده رزرو در هفته جاری
            </h2>
          </div>
          <Link
            href={`/${locale}/doctors`}
            className="flex items-center gap-1 text-primary text-sm font-bold hover:underline"
          >
            <span>مشاهده همه پزشکان</span>
            <ClinicalIcon name="arrow_back" size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURED_DOCTORS.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} locale={locale} />
          ))}
        </div>
      </section>

      {/* 4. Paraclinical Services Showcase */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label="خدمات پاراکلینیک"
      >
        <div className="bg-surface-container-low rounded-3xl p-6 sm:p-8 md:p-10 border border-outline-variant/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div className="text-start">
              <span className="text-xs sm:text-sm font-bold text-secondary block mb-1">
                خدمات پاراکلینیک دارای استانداردهای بالینی
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
                بسته‌های تشخیصی و آزمایش‌های برگزیده
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
                شفافیت کامل در دستورالعمل ناشتایی و آمادگی قبل از آزمون همراه با صدور برخط فیش بیمه.
              </p>
              <Link
                href={`/${locale}/services`}
                className="flex items-center gap-1 text-primary text-sm font-bold hover:underline shrink-0"
              >
                <span>مشاهده کلیه خدمات</span>
                <ClinicalIcon name="arrow_back" size={16} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURED_SERVICES.map((service) => (
              <ServiceCard key={service.id} service={service} locale={locale} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Interactive Metabolism Calculator Section */}
      <section id="metabolism-section">
        <MetabolismCalculator locale={locale} />
      </section>

      {/* 6. Clinical Knowledge & Video Library Showcase */}
      <section
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full"
        aria-label="دانشنامه و رسانه پزشکی"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div className="text-start">
            <span className="text-xs sm:text-sm font-bold text-secondary block mb-1">
              دانشنامه و رسانه پزشکی انگبین طب
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              تازه‌های بالینی و ویدیوهای آموزشی سلامت
            </h2>
          </div>
          <Link
            href={`/${locale}/articles`}
            className="flex items-center gap-1 text-primary text-sm font-bold hover:underline"
          >
            <span>مشاهده آرشیو کامل مقالات</span>
            <ClinicalIcon name="arrow_back" size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ArticleCard article={FEATURED_ARTICLES[0]} locale={locale} />
          <ArticleCard article={FEATURED_ARTICLES[1]} locale={locale} />
          <VideoCard video={FEATURED_VIDEO} locale={locale} />
        </div>
      </section>

      {/* 7. Clinical Accreditation, Trust Metrics & Transparency */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
        <TrustMetrics />
      </section>
    </div>
  );
}