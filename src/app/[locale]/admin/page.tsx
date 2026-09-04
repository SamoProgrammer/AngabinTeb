import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users, translations, providers, services, appointments, contents } from "@/db/schema";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits } from "@/components/catalog/doctor-card";

export default async function AdminOverviewPage() {
  const [
    userCount,
    providerCount,
    serviceCount,
    appointmentCount,
    contentCount,
    translationCount,
  ] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(providers),
    db.select({ n: count() }).from(services),
    db.select({ n: count() }).from(appointments),
    db.select({ n: count() }).from(contents),
    db.select({ n: count() }).from(translations),
  ]);

  const stats = [
    {
      title: "بیماران و کاربران فعال",
      value: userCount[0]?.n ?? 0,
      icon: "group",
      href: "/admin/settings",
      note: "پروفایل‌های سلامت ثبت‌شده",
    },
    {
      title: "پزشکان و ارائه‌دهندگان",
      value: providerCount[0]?.n ?? 0,
      icon: "stethoscope",
      href: "/admin/providers",
      note: "پزشکان تایید شده بالینی",
    },
    {
      title: "خدمات درمانی و چکاپ",
      value: serviceCount[0]?.n ?? 0,
      icon: "medical_services",
      href: "/admin/services",
      note: "بسته‌ها و آزمایش‌های فعال",
    },
    {
      title: "کل نوبت‌های ثبت‌شده",
      value: appointmentCount[0]?.n ?? 0,
      icon: "calendar_month",
      href: "/admin/scheduling",
      note: "مدیریت اسلات‌ها و پذیرش",
    },
    {
      title: "مقالات و وبینارها",
      value: contentCount[0]?.n ?? 0,
      icon: "article",
      href: "/admin/content",
      note: "محتواهای بالینی منتشرشده",
    },
    {
      title: "عناوین پایگاه ترجمه",
      value: translationCount[0]?.n ?? 0,
      icon: "translate",
      href: "/admin/settings",
      note: "دوزبانه فارسی، انگلیسی و عربی",
    },
  ];

  const quickActions = [
    { title: "تعریف پزشک جدید", href: "/admin/providers/new", icon: "person_add" },
    { title: "ایجاد خدمت درمانی", href: "/admin/services/new", icon: "add_circle" },
    { title: "زمان‌بندی اسلات‌ها", href: "/admin/scheduling", icon: "calendar_today" },
    { title: "انتشار مقاله جدید", href: "/admin/content/new", icon: "post_add" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 text-start">
        <div>
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-full mb-2">
            <ClinicalIcon name="dashboard" size={16} />
            <span>مرکز فرماندهی عملیات بالینی</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            داشبورد نظارت و مدیریت سیستم
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            پایش آنی ظرفیت نوبت‌ها، پزشکان، محتوای آموزشی و سوابق سامانه سلامت انگبین طب
          </p>
        </div>

        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-xl text-xs text-primary font-bold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>سامانه عملیاتی و پایگاه داده متصل است</span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <section aria-label="آمار و شاخص‌های کلیدی" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Link
            key={idx}
            href={stat.href}
            className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs hover:shadow-tier-1 hover:border-primary/40 transition-all flex flex-col justify-between text-start group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-on-surface-variant">{stat.title}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <ClinicalIcon name={stat.icon} size={22} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-on-surface">
                {toPersianDigits(stat.value)}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between text-[11px] text-outline">
              <span>{stat.note}</span>
              <ClinicalIcon name="arrow_back" size={14} className="group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </section>

      {/* Quick Actions Bar */}
      <section aria-label="دسترسی‌های سریع مدیریتی" className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs text-start">
        <h2 className="text-sm sm:text-base font-bold text-on-surface mb-4">
          عملیات و دسترسی‌های سریع
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((qa, idx) => (
            <Link
              key={idx}
              href={qa.href}
              className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-colors border border-outline-variant/10"
            >
              <ClinicalIcon name={qa.icon} size={20} className="text-primary" />
              <span>{qa.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}