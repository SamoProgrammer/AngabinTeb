import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cards = [
    {
      kind: "question",
      title: "پرسش عمومی و راهنمایی",
      description: "راهنمایی درباره نحوه نوبت‌دهی، خدمات تشخیصی، بیمه‌ها و هزینه‌ها.",
      icon: "help",
    },
    {
      kind: "complaint",
      title: "ثبت نظر یا انتقاد",
      description: "انتقادات و پیشنهادات خود را جهت ارتقای کیفیت خدمات با ما در میان بگذارید.",
      icon: "rate_review",
    },
    {
      kind: "appointment_issue",
      title: "پیگیری یا تغییر نوبت",
      description: "گزارش مشکل در رزرو، تغییر ساعت ویزیت یا عدم هماهنگی با مطب.",
      icon: "calendar_month",
    },
  ] as const;

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header Hero */}
        <div className="flex flex-col gap-3 text-start max-w-3xl">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs sm:text-sm bg-primary/10 px-3 py-1.5 rounded-full self-start">
            <ClinicalIcon name="support_agent" size={18} />
            <span>پشتیبانی و ارتباط با مراجعین</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            مرکز پشتیبانی مراجعین انگبین طب
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            همکاران ما در واحد پشتیبانی و امور مراجعین همه روزه آماده پاسخگویی به پرسش‌ها و حل سریع چالش‌های شما هستند.
          </p>
        </div>

        {/* Support Inquiry Cards Grid */}
        <section aria-label="دسته‌بندی درخواست‌های پشتیبانی" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <Link
              key={c.kind}
              href={`/${locale}/support/new?kind=${c.kind}`}
              className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs hover:shadow-tier-2 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between text-start group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <ClinicalIcon name={c.icon} size={26} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-on-surface group-hover:text-primary transition-colors mb-2">
                  {c.title}
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-bold">
                <span>ثبت درخواست</span>
                <span className="flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
                  <ClinicalIcon name="arrow_back" size={16} />
                </span>
              </div>
            </Link>
          ))}
        </section>

        {/* Action Links & FAQ Redirect */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="flex items-center gap-3 text-start">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ClinicalIcon name="assignment" size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">سوابق درخواست‌های پشتیبانی</p>
              <p className="text-xs text-on-surface-variant">مشاهده و پیگیری تیکت‌های قبلی ارسال‌شده</p>
            </div>
          </div>
          <Link
            href={`/${locale}/support/requests`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
          >
            <span>مشاهده درخواست‌های من</span>
            <ClinicalIcon name="arrow_back" size={16} />
          </Link>
        </div>

        {/* FAQ Quick Link Card */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-primary/20 text-start">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <h3 className="text-base sm:text-lg font-bold text-on-surface">
              آیا پرسش شما در میان سوالات پرتکرار است؟
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              پاسخ به سوالات متداول درباره بیمه‌ها، کنسلی نوبت و نحوه پرداخت در صفحه پرسش‌های متداول در دسترس شماست.
            </p>
          </div>
          <Link
            href={`/${locale}/faq`}
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs hover:bg-primary-container transition-all shrink-0"
          >
            <ClinicalIcon name="help" size={18} />
            <span>مشاهده پرسش‌های متداول</span>
          </Link>
        </div>
      </main>
    </div>
  );
}