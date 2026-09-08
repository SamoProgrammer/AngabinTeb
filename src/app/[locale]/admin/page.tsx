import Link from "next/link";
import { count } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { users, translations, providers, services, appointments, contents } from "@/db/schema";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseMedical,
  Calendar,
  CalendarDays,
  CirclePlus,
  FilePlus,
  Globe,
  LayoutDashboard,
  Newspaper,
  Stethoscope,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toPersianDigits } from "@/lib/format";

export default async function AdminOverviewPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;
  const isRtl = locale !== "en";
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const t = await getTranslations("admin.overview");

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

  const stats: { title: string; value: number; icon: LucideIcon; href: string; note: string }[] = [
    {
      title: t("stats.users.title"),
      value: userCount[0]?.n ?? 0,
      icon: Users,
      href: `${prefix}/admin/settings`,
      note: t("stats.users.note"),
    },
    {
      title: t("stats.providers.title"),
      value: providerCount[0]?.n ?? 0,
      icon: Stethoscope,
      href: `${prefix}/admin/providers`,
      note: t("stats.providers.note"),
    },
    {
      title: t("stats.services.title"),
      value: serviceCount[0]?.n ?? 0,
      icon: BriefcaseMedical,
      href: `${prefix}/admin/services`,
      note: t("stats.services.note"),
    },
    {
      title: t("stats.appointments.title"),
      value: appointmentCount[0]?.n ?? 0,
      icon: CalendarDays,
      href: `${prefix}/admin/scheduling`,
      note: t("stats.appointments.note"),
    },
    {
      title: t("stats.content.title"),
      value: contentCount[0]?.n ?? 0,
      icon: Newspaper,
      href: `${prefix}/admin/content`,
      note: t("stats.content.note"),
    },
    {
      title: t("stats.translations.title"),
      value: translationCount[0]?.n ?? 0,
      icon: Globe,
      href: `${prefix}/admin/settings`,
      note: t("stats.translations.note"),
    },
  ];

  const quickActions: { title: string; href: string; icon: LucideIcon }[] = [
    { title: t("quick.newProvider"), href: `${prefix}/admin/providers/new`, icon: UserPlus },
    { title: t("quick.newService"), href: `${prefix}/admin/services/new`, icon: CirclePlus },
    { title: t("quick.scheduling"), href: `${prefix}/admin/scheduling`, icon: Calendar },
    { title: t("quick.newContent"), href: `${prefix}/admin/content/new`, icon: FilePlus },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 text-start">
        <div>
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs bg-primary/10 px-2.5 py-1 rounded-full mb-2">
            <LayoutDashboard size={16} aria-hidden="true" />
            <span>{t("badge")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-xl text-xs text-primary font-bold self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>{t("statusConnected")}</span>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <section aria-label="Stats Overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Link
            key={idx}
            href={stat.href}
            className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs hover:shadow-tier-1 hover:border-primary/40 transition-all flex flex-col justify-between text-start group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-on-surface-variant">{stat.title}</span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <stat.icon size={22} aria-hidden="true" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-on-surface">
                {locale === "en" ? stat.value : toPersianDigits(stat.value)}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-outline-variant/10 flex items-center justify-between text-[11px] text-outline">
              <span>{stat.note}</span>
              <ArrowIcon size={14} className="group-hover:text-primary transition-colors" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </section>

      {/* Quick Actions Bar */}
      <section aria-label="Quick Actions" className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs text-start">
        <h2 className="text-sm sm:text-base font-bold text-on-surface mb-4">
          {t("quickActionsTitle")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((qa, idx) => (
            <Link
              key={idx}
              href={qa.href}
              className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs sm:text-sm font-semibold flex items-center gap-2.5 transition-colors border border-outline-variant/10"
            >
              <qa.icon size={20} className="text-primary" aria-hidden="true" />
              <span>{qa.title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}