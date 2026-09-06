import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default function AboutPage() {
  const pillars = [
    {
      icon: "science",
      title: "پزشکی مبتنی بر شواهد بالینی",
      description: "تمامی پروتکل‌های درمانی، مقالات و توصیه‌ها منطبق بر آخرین گایدلاین‌های معتبر علوم پزشکی و پژوهشکده‌های غدد ارائه می‌شوند.",
    },
    {
      icon: "restaurant",
      title: "تغذیه اصیل متناسب با سفره ایرانی",
      description: "ما بر این باوریم که اصلاح پایدار سلامت با حذف غذاهای خانگی حاصل نمی‌شود، بلکه با تعادل هوشمند درشت‌مغذی‌ها در فرهنگ غذایی بومی پایدار می‌ماند.",
    },
    {
      icon: "payments",
      title: "شفافیت کامل و پرداخت در مطب",
      description: "رزرو نوبت در انگبین طب کاملاً رایگان است و هیچ کارمزدی از بیمار اخذ نمی‌گردد. پرداخت صرفاً در مرکز درمانی و طبق تعرفه قانونی انجام می‌شود.",
    },
    {
      icon: "lock",
      title: "امنیت داده و محرمانگی پرونده سلامت",
      description: "سوابق پزشکی، آزمایش‌ها و پارامترهای بیومتریک شما با بالاترین استانداردهای رمزنگاری حفاظت شده و فقط با رضایت شما در دسترس پزشک قرار دارد.",
    },
  ];

  const board = [
    {
      name: "دکتر لیلا سادات",
      title: "فوق‌تخصص غدد و متابولیسم",
      role: "رئیس شورای علمی و سیاست‌گذاری سلامت",
    },
    {
      name: "دکتر آرش رادمنش",
      title: "متخصص قلب و عروق",
      role: "عضو کارگروه پایش عروقی و ریسک متابولیک",
    },
    {
      name: "دکتر فرهاد مرادی",
      title: "دکترای تخصصی علوم تغذیه و رژیم‌درمانی",
      role: "مدیر بخش پژوهش ترکیبات غذایی و متابولیسم",
    },
  ];

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-16">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 sm:gap-16">
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
            درباره سامانه جامع سلامت بالینی انگبین طب
          </h1>
          <p className="text-sm sm:text-lg text-on-surface-variant leading-relaxed">
            انگبین طب بستری برای دسترسی آسان به نوبت‌دهی پزشکان متخصص، خدمات درمانی و برنامه‌های تغذیه بالینی است.
          </p>
        </section>

        {/* Core Pillars */}
        <section aria-label="ارکان بنیادین" className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-3 text-start"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ClinicalIcon name={p.icon} size={26} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-on-surface">{p.title}</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </section>

        {/* Clinical Governance & Advisory Board */}
        <section aria-label="هیئت علمی و مشاوران" className="flex flex-col gap-6 text-start">
          <div className="border-b border-outline-variant/20 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              هیئت علمی و مشاوران پزشکی انگبین طب
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              پایش و اعتبارسنجی مداوم پروتکل‌ها و مقالات توسط پزشکان و اساتید برجسته علوم پزشکی
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {board.map((member, idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col items-center text-center gap-3"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                  <ClinicalIcon name="person" size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">{member.name}</h3>
                  <p className="text-xs text-primary font-medium mt-0.5">{member.title}</p>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}