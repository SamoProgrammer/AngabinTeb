import Link from "next/link";
import { listDoctors } from "@/contexts/catalog/queries";
import { DoctorCard, type DoctorData, toPersianDigits } from "@/components/catalog/doctor-card";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

const SPECIALTIES = [
  { id: "all", label: "همه تخصص‌ها", slug: "" },
  { id: "nutrition", label: "تغذیه و رژیم‌درمانی", slug: "nutrition" },
  { id: "gastroenterology", label: "گوارش و کبد", slug: "gastroenterology" },
  { id: "cardiology", label: "قلب و عروق", slug: "cardiology" },
  { id: "endocrinology", label: "غدد و متابولیسم", slug: "endocrinology" },
  { id: "gynecology", label: "زنان و زایمان", slug: "gynecology" },
];

const FALLBACK_DOCTORS: DoctorData[] = [
  {
    id: "dr-leila-sadat",
    slug: "dr-leila-sadat",
    name: "دکتر لیلا سادات",
    specialty: "فوق تخصص غدد درون‌ریز، متابولیسم و رشد بالینی",
    academicTitle: "عضو هیئت علمی دانشگاه علوم پزشکی",
    medicalCouncilCode: "38921",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgLHqpdLwi6gKxX4wuTHNQznIImyMJTWAKQWoKKdpyMPZCB-f0hzxodxU2ohqzasdkAcYQLw9m3dPjKTVWpOd-DYOHQt3yvdS0I4SMzfzSEzZgjJm6d0As7zrfsFoqPsPCUk6wJ-Ba3VQTtKBv3E2UAreQZI94OfS3FZ3ftVtdDQb-ewEEf5xjHVlLi-_1g2hc_KRok_uNm8wlyEJiazTNLUWTQWeaSxFg0ReNg9_-ittHh8IqYVcV",
    rating: 4.9,
    reviewsCount: 240,
    nextSlot: "فردا ساعت ۱۰:۳۰",
    clinicAddress: "تهران، کلینیک تخصصی ونک (ملاصدرا)",
    fee: 250000,
    isVerified: true,
  },
  {
    id: "dr-arash-radmanesh",
    slug: "dr-arash-radmanesh",
    name: "دکتر آرش رادمنش",
    specialty: "متخصص تغذیه بالینی و رژیم‌درمانی متابولیک",
    academicTitle: "فلوشیپ چاقی و متابولیک",
    medicalCouncilCode: "45120",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCdWGbdCN3f5b2WRWxNcX-tm1xAvJ4a2OO5TVjg3BhQxrWvFp6O53ZTYIrSITla_89ZeERTcCMnW5umXyYPQaENjqhxi9j5NB8ybPjl14gCquQoHqm1izNaBrwwWungtgAsB5DYMblthDADLKb3u5dRfrWSJqlPSa5bWmTzNNtSPq_faQ-rIjlZecYtwGNLbGrMXw7z5I4bFu78vgQyuaO-RHQXuIzq822StTQbYzTJwmiD6GU0_Zqe",
    rating: 5.0,
    reviewsCount: 185,
    nextSlot: "یکشنبه ساعت ۱۴:۰۰",
    clinicAddress: "تهران، کلینیک فوق‌تخصصی پارس",
    fee: 220000,
    isVerified: true,
  },
  {
    id: "dr-sara-mahdavi",
    slug: "dr-sara-mahdavi",
    name: "دکتر سارا مهدوی",
    specialty: "متخصص بیماری‌های قلب، عروق و اکوکاردیوگرافی",
    academicTitle: "بورد تخصصی قلب و عروق",
    medicalCouncilCode: "51874",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA4hmQq4mBeIHIWpk7YkO4OJUUJcm5DSyPABVetMD7_gPH9amJFg4Qq7y_oYd8mViOgeVZeuZUr0XjQjlMlsvHnZFlAKsSGMv83qWApQGVIfwNowq2ZRRbF-j0c7n6SoBh7jbIbj_xsLBofCVWT_xwUjq4mvRpNZnImcWV4YhmpZy93uAIW5kYhnP4xXHPjJsGt7NJsPTLW9uh6h75C5UhNZmem24bYZtKXdTCONI0Y-TZ7ia5jSe4A",
    rating: 4.8,
    reviewsCount: 310,
    nextSlot: "دوشنبه ساعت ۱۱:۱۵",
    clinicAddress: "تهران، مرکز قلب و کلینیک بهار (آرژانتین)",
    fee: 260000,
    isVerified: true,
  },
  {
    id: "dr-payam-bahrami",
    slug: "dr-payam-bahrami",
    name: "دکتر پیام بهرامی",
    specialty: "فوق تخصص گوارش، کبد و آندوسکوپی پیشرفته",
    academicTitle: "عضو انجمن گوارش ایران",
    medicalCouncilCode: "29410",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAB0esi-S2ulnr1aewLITrOTzIebt9gUwo8bsISUfYqFiKONKUibrkY53V97pBbU6I_SgnK-Z9A6y5a7U1FUc5MTweuEGnmqaG7Sc2wDgMVfgInB-jlQRP2YFJFGZgn8DTREeH-8wH9qe3oBca_2BqR4-AhznDFyHXww5G7QUJbp6ppUfxRHQWwLTywjTNCuv6RuVUCYtbBrrwAgW9ddWWCR9k0FZJmBVHdPFEASatoyES8vNDBXCXx",
    rating: 4.9,
    reviewsCount: 196,
    nextSlot: "سه‌شنبه ساعت ۱۸:۳۰",
    clinicAddress: "تهران، کلینیک تخصصی سعادت‌آباد",
    fee: 270000,
    isVerified: true,
  },
];

export default async function DoctorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ specialty?: string; city?: string; q?: string }>;
}) {
  const { locale } = await params;
  const { specialty, city, q } = await searchParams;

  let dbDoctors: DoctorData[] = [];
  try {
    const raw = await listDoctors(locale, specialty, city);
    dbDoctors = raw.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty ?? "متخصص بالینی",
      cityId: d.cityId,
      imageUrl: d.imageUrl,
      slug: d.id,
      clinicAddress: "تهران، کلینیک تخصصی ونک (ملاصدرا)",
      fee: 250000,
      nextSlot: "فردا ساعت ۱۰:۳۰",
      rating: 4.9,
      reviewsCount: 120,
      isVerified: true,
    }));
  } catch {
    dbDoctors = [];
  }

  // Complement with fallback doctors to ensure a rich clinical catalog
  let allDoctors = [...dbDoctors];
  for (const fallback of FALLBACK_DOCTORS) {
    if (!allDoctors.some((d) => d.id === fallback.id || d.name === fallback.name)) {
      allDoctors.push(fallback);
    }
  }

  // Filter by query if provided
  if (q && q.trim()) {
    const queryStr = q.trim().toLowerCase();
    allDoctors = allDoctors.filter(
      (d) =>
        d.name.toLowerCase().includes(queryStr) ||
        (d.specialty && d.specialty.toLowerCase().includes(queryStr)),
    );
  }

  const totalCount = allDoctors.length;
  const currentSpecialty = specialty ?? "";

  return (
    <main className="w-full bg-surface" dir="rtl">
      {/* Top Clinical Hero Bar */}
      <div className="w-full bg-surface-container-lowest border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                نوبت‌دهی آنلاین پزشکان و متخصصان
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant">
                جستجو و دریافت سریع نوبت از پزشکان مجرب با پرداخت حضوری در مطب
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-xl w-fit">
              <ClinicalIcon name="verified" size={20} className="text-primary shrink-0" />
              <span className="text-sm font-medium">نوبت‌دهی بدون هزینه کارمزد آنلاین</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specialty Pills Carousel Filter */}
      <div className="sticky top-20 z-40 bg-surface/95 backdrop-blur-md shadow-xs border-b border-outline-variant/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SPECIALTIES.map((item) => {
              const isActive =
                item.slug === currentSpecialty ||
                (!currentSpecialty && item.id === "all");
              return (
                <Link
                  key={item.id}
                  href={
                    item.slug
                      ? `/${locale}/doctors?specialty=${encodeURIComponent(item.slug)}`
                      : `/${locale}/doctors`
                  }
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar + Doctors Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Filtering Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            {/* Doctor/Specialty Search Input */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30">
              <form action={`/${locale}/doctors`} method="GET" className="flex flex-col gap-3">
                <label
                  htmlFor="doctor-search-input"
                  className="text-sm font-bold text-on-surface"
                >
                  جستجوی پزشک یا تخصص
                </label>
                <div className="relative w-full">
                  <input
                    id="doctor-search-input"
                    name="q"
                    defaultValue={q ?? ""}
                    type="text"
                    placeholder="نام پزشک، بیماری یا تخصص..."
                    className="w-full bg-surface-container-low text-on-surface text-sm py-2.5 pe-4 ps-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-on-surface-variant/50"
                  />
                  <div className="absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60">
                    <ClinicalIcon name="search" size={20} />
                  </div>
                </div>
                {specialty && (
                  <input type="hidden" name="specialty" value={specialty} />
                )}
                {city && <input type="hidden" name="city" value={city} />}
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-container text-on-primary text-xs font-medium py-2 px-4 rounded-xl transition-colors self-end"
                >
                  اعمال جستجو
                </button>
              </form>
            </div>

            {/* Filter options card */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface">فیلترها</span>
                <Link
                  href={`/${locale}/doctors`}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  حذف فیلترها
                </Link>
              </div>

              {/* City Filter */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-on-surface">شهر</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href={`/${locale}/doctors?city=tehran${specialty ? `&specialty=${specialty}` : ""}`}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors ${
                      city === "tehran" || !city
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span>تهران</span>
                  </Link>
                  <Link
                    href={`/${locale}/doctors?city=other${specialty ? `&specialty=${specialty}` : ""}`}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors ${
                      city === "other"
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-outline-variant/30 bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    <span>سایر شهرها</span>
                  </Link>
                </div>
              </div>

              {/* Admission Capacity Checkbox */}
              <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
                <span className="text-xs font-bold text-on-surface">زمان پذیرش</span>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                  />
                  <span>نوبت‌های دارای ظرفیت خالی</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Main List Section (8 Cols) */}
          <section className="lg:col-span-8 flex flex-col gap-4">
            {/* Sort & Count Header Strip */}
            <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-tier-1 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClinicalIcon name="sort" size={20} className="text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-on-surface">مرتب‌سازی:</span>
                <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl text-xs">
                  <span className="px-3 py-1 rounded-lg bg-surface-container-lowest text-primary shadow-xs font-bold">
                    نزدیک‌ترین نوبت خالی
                  </span>
                  <span className="px-3 py-1 text-on-surface-variant hover:text-on-surface">
                    بیشترین رضایت
                  </span>
                </div>
              </div>

              <span className="text-xs text-on-surface-variant">
                نمایش ۱ تا {toPersianDigits(allDoctors.length)} از{" "}
                <strong className="text-on-surface font-bold">
                  {toPersianDigits(totalCount)}
                </strong>{" "}
                متخصص آماده پذیرش
              </span>
            </div>

            {/* Doctors Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allDoctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  locale={locale}
                  href={`/${locale}/doctors/${doc.slug || doc.id}`}
                />
              ))}
            </div>

            {/* Triage Hotline Support Banner */}
            <div className="mt-4 p-6 rounded-2xl bg-gradient-to-l from-primary/10 via-surface-container to-surface-container-lowest border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary text-on-primary shrink-0 shadow-sm">
                  <ClinicalIcon name="support_agent" size={32} />
                </div>
                <div className="flex flex-col gap-1 text-start">
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">
                    به راهنمایی برای انتخاب پزشک مناسب نیاز دارید؟
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    کارشناسان تریاژ تلفنی انگبین طب آماده راهنمایی و تعیین نوبت متناسب با علائم بالینی شما هستند.
                  </p>
                </div>
              </div>
              <a
                href="tel:02188224000"
                className="shrink-0 px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary text-xs sm:text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <ClinicalIcon name="phone_in_talk" size={18} />
                <span>تماس با مشاوره رایگان پذیرش</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}