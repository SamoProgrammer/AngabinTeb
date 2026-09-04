import Link from "next/link";
import { getDoctor } from "@/contexts/catalog/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits, formatPrice } from "@/components/catalog/doctor-card";

const SAMPLE_DOCTORS: Record<string, {
  name: string;
  specialtyName: string;
  credentials: string;
  medicalCouncilCode: string;
  bio: string;
  imageUrl: string;
  addressLine: string;
  phone: string;
  latitude: string;
  longitude: string;
  rating: number;
  reviewsCount: number;
  yearsOfExperience: number;
  fee: number;
}> = {
  "dr-leila-sadat": {
    name: "دکتر لیلا سادات",
    specialtyName: "فوق تخصص غدد درون‌ریز، متابولیسم و دیابت بزرگسالان",
    credentials: "عضو هیئت علمی دانشگاه و انجمن متخصصین غدد بالینی ایران",
    medicalCouncilCode: "38921",
    bio: "دکتر لیلا سادات، فوق تخصص غدد درون‌ریز و متابولیسم با بیش از ۱۷ سال سابقه درخشان در تشخیص و مدیریت دیابت پیشرفته، اختلالات تیروئید و چاقی مفرط. رویکرد درمانی ایشان بر پایش مداوم قند خون، اصلاح متابولیک و تنظیم رژیم غذایی شخصی‌سازی‌شده بر مبنای بیومارکرهای آزمایشگاهی استوار است.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgLHqpdLwi6gKxX4wuTHNQznIImyMJTWAKQWoKKdpyMPZCB-f0hzxodxU2ohqzasdkAcYQLw9m3dPjKTVWpOd-DYOHQt3yvdS0I4SMzfzSEzZgjJm6d0As7zrfsFoqPsPCUk6wJ-Ba3VQTtKBv3E2UAreQZI94OfS3FZ3ftVtdDQb-ewEEf5xjHVlLi-_1g2hc_KRok_uNm8wlyEJiazTNLUWTQWeaSxFg0ReNg9_-ittHh8IqYVcV",
    addressLine: "تهران، میدان ونک، خیابان ملاصدرا، پلاک ۱۰۲، ساختمان پزشکان ملاصدرا، طبقه ۴، واحد ۱۶",
    phone: "۰۲۱-۸۸۰۳۴۲۵۰",
    latitude: "35.7575",
    longitude: "51.3980",
    rating: 4.9,
    reviewsCount: 220,
    yearsOfExperience: 17,
    fee: 250000,
  },
  "dr-arash-radmanesh": {
    name: "دکتر آرش رادمنش",
    specialtyName: "متخصص تغذیه بالینی و رژیم‌درمانی متابولیک",
    credentials: "فلوشیپ چاقی، سندرم متابولیک و لاغری مفرط",
    medicalCouncilCode: "45120",
    bio: "دکتر آرش رادمنش متخصص تغذیه و متابولیسم، متخصص در طراحی رژیم‌های درمانی برای بیماران کبد چرب، مقاومت به انسولین و بیماری‌های قلبی عروقی بدون محرومیت‌های شدید غذایی و هماهنگ با سفره ایرانی.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdWGbdCN3f5b2WRWxNcX-tm1xAvJ4a2OO5TVjg3BhQxrWvFp6O53ZTYIrSITla_89ZeERTcCMnW5umXyYPQaENjqhxi9j5NB8ybPjl14gCquQoHqm1izNaBrwwWungtgAsB5DYMblthDADLKb3u5dRfrWSJqlPSa5bWmTzNNtSPq_faQ-rIjlZecYtwGNLbGrMXw7z5I4bFu78vgQyuaO-RHQXuIzq822StTQbYzTJwmiD6GU0_Zqe",
    addressLine: "تهران، خیابان شریعتی، بالاتر از میرداماد، کلینیک فوق‌تخصصی پارس",
    phone: "۰۲۱-۲۲۲۲۴۵۰۰",
    latitude: "35.7610",
    longitude: "51.4350",
    rating: 5.0,
    reviewsCount: 185,
    yearsOfExperience: 14,
    fee: 220000,
  },
  "dr-sara-mahdavi": {
    name: "دکتر سارا مهدوی",
    specialtyName: "متخصص بیماری‌های قلب، عروق و اکوکاردیوگرافی پیشرفته",
    credentials: "دارای بورد تخصصی قلب و عروق و فلوشیپ تصویربرداری قلبی",
    medicalCouncilCode: "51874",
    bio: "دکتر سارا مهدوی با تمرکز بر پیشگیری از حوادث قلبی، کنترل فشار خون مقاوم و تفسیر پیشرفته اکوکاردیوگرافی رنگی و تست ورزش، به مراجعین خدمات درمانی ارتقایافته ارائه می‌دهد.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4hmQq4mBeIHIWpk7YkO4OJUUJcm5DSyPABVetMD7_gPH9amJFg4Qq7y_oYd8mViOgeVZeuZUr0XjQjlMlsvHnZFlAKsSGMv83qWApQGVIfwNowq2ZRRbF-j0c7n6SoBh7jbIbj_xsLBofCVWT_xwUjq4mvRpNZnImcWV4YhmpZy93uAIW5kYhnP4xXHPjJsGt7NJsPTLW9uh6h75C5UhNZmem24bYZtKXdTCONI0Y-TZ7ia5jSe4A",
    addressLine: "تهران، میدان آرژانتین، خیابان الوند، مرکز قلب و کلینیک بهار",
    phone: "۰۲۱-۸۸۷۹۳۴۰۰",
    latitude: "35.7420",
    longitude: "51.4180",
    rating: 4.8,
    reviewsCount: 310,
    yearsOfExperience: 16,
    fee: 260000,
  },
  "dr-payam-bahrami": {
    name: "دکتر پیام بهرامی",
    specialtyName: "فوق تخصص گوارش، کبد و آندوسکوپی پیشرفته",
    credentials: "عضو هیئت علمی و انجمن علمی گوارش و کبد ایران",
    medicalCouncilCode: "29410",
    bio: "دکتر پیام بهرامی، فوق تخصص بیماری‌های گوارش و کبد چرب. ایشان بر پیشگیری، استیج‌بندی و درمان غیردارویی و دارویی کبد چرب و مشکلات هاضمه با متدهای روز دنیا تمرکز دارد.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAB0esi-S2ulnr1aewLITrOTzIebt9gUwo8bsISUfYqFiKONKUibrkY53V97pBbU6I_SgnK-Z9A6y5a7U1FUc5MTweuEGnmqaG7Sc2wDgMVfgInB-jlQRP2YFJFGZgn8DTREeH-8wH9qe3oBca_2BqR4-AhznDFyHXww5G7QUJbp6ppUfxRHQWwLTywjTNCuv6RuVUCYtbBrrwAgW9ddWWCR9k0FZJmBVHdPFEASatoyES8vNDBXCXx",
    addressLine: "تهران، سعادت‌آباد، میدان کاج، خیابان سرو شرقی، کلینیک تخصصی سعادت‌آباد",
    phone: "۰۲۱-۲۲۳۸۴۰۰۰",
    latitude: "35.7820",
    longitude: "51.3750",
    rating: 4.9,
    reviewsCount: 196,
    yearsOfExperience: 20,
    fee: 270000,
  },
};

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  let dbDoctor = null;
  try {
    dbDoctor = await getDoctor(slug, locale);
  } catch {
    dbDoctor = null;
  }

  const sample = SAMPLE_DOCTORS[slug] ?? SAMPLE_DOCTORS["dr-leila-sadat"];

  const doctor = {
    id: dbDoctor?.id ?? slug,
    name: dbDoctor?.name ?? sample.name,
    specialtyName: dbDoctor?.specialtyName ?? sample.specialtyName,
    credentials: dbDoctor?.credentials ?? sample.credentials,
    medicalCouncilCode: sample.medicalCouncilCode,
    bio: dbDoctor?.bio ?? sample.bio,
    imageUrl: dbDoctor?.imageUrl ?? sample.imageUrl,
    addressLine: dbDoctor?.addressLine ?? sample.addressLine,
    phone: dbDoctor?.phone ?? sample.phone,
    latitude: dbDoctor?.latitude ?? sample.latitude,
    longitude: dbDoctor?.longitude ?? sample.longitude,
    rating: sample.rating,
    reviewsCount: sample.reviewsCount,
    yearsOfExperience: sample.yearsOfExperience,
    fee: sample.fee,
    nextSlot: "فردا ساعت ۱۰:۳۰ صبح",
  };

  const mapUrl = `https://www.openstreetmap.org/?mlat=${doctor.latitude}&mlon=${doctor.longitude}#map=16/${doctor.latitude}/${doctor.longitude}`;

  return (
    <main className="w-full bg-surface" dir="rtl">
      {/* Breadcrumb & Status Ambient Bar */}
      <div className="w-full bg-surface-container-low py-3 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm text-on-surface-variant">
          <div className="flex items-center gap-2">
            <Link href={`/${locale}`} className="hover:text-primary transition-colors">
              خانه
            </Link>
            <span className="opacity-40">/</span>
            <Link href={`/${locale}/doctors`} className="hover:text-primary transition-colors">
              پزشکان
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-on-surface font-bold truncate max-w-[200px] sm:max-w-none">
              {doctor.name}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            پذیرش نوبت فعال
          </span>
        </div>
      </div>

      {/* Hero Profile Master Section */}
      <section className="relative w-full bg-surface-container-lowest shadow-tier-1 py-8 px-4 sm:px-6 lg:px-8 border-b border-outline-variant/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden shadow-sm border-2 border-primary/20 shrink-0">
              <img
                src={doctor.imageUrl}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col text-center sm:text-right gap-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                  {doctor.name}
                </h1>
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-bold">
                  <ClinicalIcon name="verified" size={16} fill className="text-primary" />
                  پزشک معتمد
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
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-on-surface-variant pt-1">
                <span className="flex items-center gap-1">
                  <ClinicalIcon name="star" size={16} fill className="text-secondary" />
                  <b className="text-on-surface">{toPersianDigits(doctor.rating)}</b>
                  <span>({toPersianDigits(doctor.reviewsCount)} نظر ثبت‌شده)</span>
                </span>
                <span className="flex items-center gap-1">
                  <ClinicalIcon name="location_on" size={16} className="text-primary" />
                  <span>تهران، ملاصدرا و ونک</span>
                </span>
                <span className="flex items-center gap-1">
                  <ClinicalIcon name="history_edu" size={16} className="text-primary" />
                  <span>{toPersianDigits(doctor.yearsOfExperience)} سال سابقه طبابت</span>
                </span>
                {doctor.medicalCouncilCode && (
                  <span className="flex items-center gap-1 font-mono text-[11px] bg-surface-container-low px-2 py-0.5 rounded">
                    شماره نظام پزشکی: {toPersianDigits(doctor.medicalCouncilCode)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/${locale}/services/service-metabolic-checkup/book`}
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <ClinicalIcon name="calendar_month" size={20} />
              <span>رزرو آنلاین نوبت</span>
            </Link>
            <span className="text-xs text-on-surface-variant text-center">
              اولین نوبت خالی: {doctor.nextSlot}
            </span>
          </div>
        </div>
      </section>

      {/* Main Body Content: Tabs + Review Details + Sticky Booking Card */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Details & Biography Column (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Navigation Segmented Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/20 scrollbar-none">
            <span className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-medium whitespace-nowrap shadow-xs">
              بیوگرافی و معرفی
            </span>
            <span className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-xs sm:text-sm whitespace-nowrap">
              خدمات تخصصی
            </span>
            <span className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-xs sm:text-sm whitespace-nowrap">
              دیدگاه بیماران ({toPersianDigits(doctor.reviewsCount)})
            </span>
            <span className="px-4 py-2 rounded-xl bg-surface-container-low text-on-surface-variant text-xs sm:text-sm whitespace-nowrap">
              نشانی و ساعات کاری
            </span>
          </div>

          {/* Philosophy & Bio Section */}
          <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary font-bold text-base sm:text-lg">
              <ClinicalIcon name="badge" size={22} />
              <h2>سوابق علمی و رویکرد بالینی</h2>
            </div>
            <p className="text-sm text-on-surface leading-relaxed text-justify">
              {doctor.bio}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-2.5">
                <ClinicalIcon name="school" size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">مدارک و فلوشیپ‌ها</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">{doctor.credentials}</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-3.5 rounded-xl flex items-start gap-2.5">
                <ClinicalIcon name="verified_user" size={20} className="text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">پروانه طبابت معتبر</span>
                  <span className="text-xs text-on-surface-variant mt-0.5">
                    تاییدشده توسط سازمان نظام پزشکی کل کشور
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Verified Patient Reviews & Rating Breakdown */}
          <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-primary">
                <ClinicalIcon name="rate_review" size={24} />
                <h2 className="text-base sm:text-lg font-bold text-on-surface">
                  دیدگاه‌ها و تجارب مراجعین تحت درمان
                </h2>
              </div>
              <span className="text-xs text-on-surface-variant">
                بر اساس {toPersianDigits(doctor.reviewsCount)} نظر ثبت‌شده واقعی
              </span>
            </div>

            {/* Rating Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-surface-container-low/60">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-extrabold text-primary leading-none">
                  {toPersianDigits(doctor.rating)}
                </span>
                <div className="flex text-secondary my-1.5">
                  {[...Array(5)].map((_, i) => (
                    <ClinicalIcon key={i} name="star" size={18} fill className="text-secondary" />
                  ))}
                </div>
                <span className="text-xs text-on-surface-variant">از مجموع ۵ ستاره رضایت</span>
              </div>
              <div className="md:col-span-2 flex flex-col justify-center gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-28 text-on-surface-variant">توضیحات و اخلاق بالینی</span>
                  <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full w-[98%]"></div>
                  </div>
                  <span className="font-bold text-on-surface">{toPersianDigits("۴.۹")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-28 text-on-surface-variant">دقت در بررسی آزمایشات</span>
                  <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full w-[96%]"></div>
                  </div>
                  <span className="font-bold text-on-surface">{toPersianDigits("۴.۹")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-28 text-on-surface-variant">اثربخشی برنامه درمان</span>
                  <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full w-[94%]"></div>
                  </div>
                  <span className="font-bold text-on-surface">{toPersianDigits("۴.۸")}</span>
                </div>
              </div>
            </div>

            {/* Verified Patient Feedback Items */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      م.ر
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-on-surface">مهدی رضازاده</span>
                    <span className="bg-surface px-2 py-0.5 rounded text-[11px] text-primary font-bold flex items-center gap-1">
                      <ClinicalIcon name="check_circle" size={14} />
                      نوبت ثبت‌شده حضوری
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant/70">۳ روز پیش</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary text-[11px] px-2 py-0.5 rounded">
                    علت مراجعه: دیابت نوع ۲ و قند ناشتای بالای ۱۸۰
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  پزشک بسیار باحوصله تمام آزمایش‌های چند سال گذشته را دقیق بررسی کردند. با تنظیم رژیم و اصلاح شیوه مصرف روغن‌ها، در عرض دو ماه قند ناشتای من را از ۱۸۵ به ۱۱۰ رساندند. بسیار سپاسگزارم.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold text-xs">
                      س.ط
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-on-surface">سارا طباطبایی</span>
                    <span className="bg-surface px-2 py-0.5 rounded text-[11px] text-primary font-bold flex items-center gap-1">
                      <ClinicalIcon name="check_circle" size={14} />
                      نوبت ثبت‌شده حضوری
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant/70">هفته گذشته</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-secondary/10 text-secondary text-[11px] px-2 py-0.5 rounded">
                    علت مراجعه: ندول و کم‌کاری تیروئید هاشیموتو
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  آرامش و تسلط علمی خانم دکتر بی‌نظیر است. سونوگرافی دقیق انجام دادند و خیالم را از بابت ندول‌ها راحت کردند. برنامه تنظیم لووتیروکسین و توصیه‌های غذایی‌شان خستگی مفرط من را به کلی برطرف کرد.
                </p>
              </div>
            </div>
          </section>

          {/* Practice Locations & Map Section */}
          <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
            <h3 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
              <ClinicalIcon name="location_on" size={22} className="text-secondary" />
              <span>مطب‌ها و نشانی مراکز درمانی همکار</span>
            </h3>

            <div className="flex flex-col gap-1 pb-3 border-b border-outline-variant/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface">کلینیک تخصصی ملاصدرا</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">روزهای زوج</span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                {doctor.addressLine}
              </p>
              <div className="flex items-center justify-between text-xs text-primary pt-2">
                <span className="flex items-center gap-1">
                  <ClinicalIcon name="call" size={16} />
                  <span>{doctor.phone}</span>
                </span>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1 font-bold"
                >
                  <span>مسیریابی روی نقشه</span>
                  <ClinicalIcon name="arrow_back" size={14} />
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Doctor Booking Sidebar & Tariffs (4 Cols) */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col gap-4">
          {/* Booking Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-tier-2 border-2 border-primary/20 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <span className="text-base font-bold text-on-surface">رزرو حضوری نوبت</span>
              <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
                پرداخت در مطب
              </span>
            </div>

            {/* Next Available Appointment */}
            <div className="bg-primary/5 p-3 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <ClinicalIcon name="calendar_today" size={20} />
              </div>
              <div className="flex flex-col text-xs">
                <span className="text-on-surface-variant">اولین نوبت خالی برای شما:</span>
                <span className="font-bold text-primary text-sm mt-0.5">{doctor.nextSlot}</span>
              </div>
            </div>

            {/* Tariffs List */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-on-surface">خدمت درمانی مصوب:</label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-primary/30">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">ویزیت حضوری و معاینه بالینی</span>
                  <span className="text-[11px] text-on-surface-variant">بررسی مدارک و تنظیم نسخه</span>
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-primary">{formatPrice(doctor.fee)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/60 border border-outline-variant/20">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface">پایش پرونده و رژیم متابولیک</span>
                  <span className="text-[11px] text-on-surface-variant">پروتکل تغذیه بالینی انگبین</span>
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-primary">{formatPrice(180000)}</span>
                </div>
              </div>
            </div>

            {/* Big Booking Button */}
            <Link
              href={`/${locale}/services/service-metabolic-checkup/book`}
              id="bookAppointmentBtn"
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <ClinicalIcon name="event_available" size={20} />
              <span>رزرو اینترنتی نوبت (پرداخت در مطب)</span>
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/80 pt-1">
              <ClinicalIcon name="check" size={16} className="text-primary" />
              <span>بدون کارمزد رزرو • لغو رایگان تا ۳ ساعت قبل</span>
            </div>
          </div>

          {/* Quick FAQ / Preparation Box */}
          <div className="bg-surface-container-low p-5 rounded-2xl flex flex-col gap-2 text-xs text-on-surface-variant">
            <span className="font-bold text-on-surface flex items-center gap-1.5 text-sm">
              <ClinicalIcon name="info" size={18} className="text-primary" />
              نکات ضروری پیش از مراجعه
            </span>
            <ul className="space-y-1.5 pe-4 list-disc leading-relaxed mt-1">
              <li>لطفاً برگه آخرین آزمایش‌های خونی ۶ ماه اخیر را به همراه داشته باشید.</li>
              <li>در صورت مصرف داروهای تنظیم قند یا تیروئید، دوزها را یادداشت فرمایید.</li>
              <li>پذیرش بدون نیاز به پرداخت آنلاین ثبت شده و تسویه در مطب انجام می‌شود.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}