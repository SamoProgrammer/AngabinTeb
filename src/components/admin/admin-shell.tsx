"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { resolveIcon } from "@/components/clinical/icons";
import { LocaleSwitcher } from "@/components/locale-switcher";

export interface AdminShellProps {
  children: ReactNode;
  activePath?: string;
  locale?: string;
}

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", key: "dashboard", label: "داشبورد عملیات", icon: "dashboard" },
  { href: "/admin/providers", key: "providers", label: "پزشکان و ارائه‌دهندگان", icon: "stethoscope" },
  { href: "/admin/services", key: "services", label: "خدمات و آزمایش‌ها", icon: "medical_services" },
  { href: "/admin/categories", key: "categories", label: "دسته‌بندی خدمات", icon: "category" },
  { href: "/admin/locations", key: "locations", label: "مراکز و کلینیک‌ها", icon: "location_on" },
  { href: "/admin/scheduling", key: "scheduling", label: "زمان‌بندی و اسلات‌ها", icon: "calendar_month" },
  { href: "/admin/foods", key: "foods", label: "بانک خوراک‌های ایرانی", icon: "restaurant" },
  { href: "/admin/diet-programs", key: "dietPrograms", label: "برنامه‌های تغذیه", icon: "menu_book" },
  { href: "/admin/content", key: "content", label: "مدیریت مقالات و مدیا", icon: "article" },
  { href: "/admin/topics", key: "topics", label: "مراکز سلامت ۳۶۰°", icon: "hub" },
  { href: "/admin/support", key: "support", label: "پشتیبانی و تیکت‌ها", icon: "support_agent" },
  { href: "/admin/settings", key: "settings", label: "تنظیمات سامانه", icon: "settings" },
] as const;

const SHELL_LABELS = {
  consoleTitle: { fa: "کنسول مدیریت بالینی", en: "Clinical Admin Console", ar: "وحدة الإدارة السريرية" },
  brand: { fa: "انگبین طب", en: "Angabin Teb", ar: "أنغبين طب" },
  portalLink: { fa: "مشاهده پورتال اصلی", en: "View Main Portal", ar: "عرض البوابة الرئيسية" },
  adminBadge: { fa: "مدیر ارشد سامانه", en: "Chief System Administrator", ar: "المدير العام للنظام" },
  adminPanel: { fa: "پنل مدیر", en: "Admin Panel", ar: "لوحة المسؤول" },
};

export function AdminShell({ children, activePath, locale }: AdminShellProps) {
  // Navigation-driven highlight: explicit prop wins (tests/embeds),
  // otherwise track the real route so the sidebar follows navigation.
  const pathname = usePathname();
  const currentPath = activePath ?? pathname ?? "/admin";
  let contextLocale: string | undefined;
  try {
    contextLocale = useLocale();
  } catch {
    // Fallback if rendered outside next-intl provider
  }

  const effectiveLocale = locale || contextLocale || "fa";
  const currentLocale: "fa" | "en" | "ar" =
    effectiveLocale === "en" || effectiveLocale === "ar" ? effectiveLocale : "fa";
  const isRtl = currentLocale !== "en";
  const prefix = `/${currentLocale}`;

  let tShell: ((key: string) => string) | undefined;
  let tNav: ((key: string) => string) | undefined;
  try {
    tShell = useTranslations("admin.shell");
    tNav = useTranslations("admin.nav");
  } catch {
    // Fallback if rendered outside next-intl provider
  }

  const getShellText = (k: keyof typeof SHELL_LABELS) => {
    if (tShell) {
      const trans = tShell(k);
      if (trans && trans !== k) return trans;
    }
    return SHELL_LABELS[k][currentLocale];
  };

  const getNavText = (key: string, defaultLabel: string) => {
    if (tNav) {
      const trans = tNav(key);
      if (trans && trans !== key) return trans;
    }
    return defaultLabel;
  };

  const BrandIcon = resolveIcon("spa");
  const PortalIcon = resolveIcon(isRtl ? "arrow_forward" : "arrow_back");
  const AdminIcon = resolveIcon("person");

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen bg-surface">
      {/* Admin Clinical Sidebar */}
      <aside className="w-64 bg-surface-container-lowest border-e border-outline-variant/30 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Admin Header Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/20">
            <Link href={`${prefix}/admin`} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
                <BrandIcon size={18} aria-hidden="true" />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-extrabold text-sm text-primary">
                  {getShellText("consoleTitle")}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {getShellText("brand")}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex flex-col gap-1 text-start overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            {ADMIN_NAV_ITEMS.map((item) => {
              const itemHref = `${prefix}${item.href}`;
              const isActive =
                currentPath === item.href ||
                currentPath === itemHref ||
                (item.href !== "/admin" &&
                  (currentPath.startsWith(item.href) || currentPath.startsWith(itemHref)));

              const localizedLabel = getNavText(item.key, item.label);
              const ItemIcon = resolveIcon(item.icon);

              return (
                <Link
                  key={item.href}
                  href={itemHref}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs font-bold"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <ItemIcon size={20} aria-hidden="true" />
                  <span>{localizedLabel}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href={prefix}
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <PortalIcon size={16} aria-hidden="true" />
              <span>{getShellText("portalLink")}</span>
            </Link>
          </div>
          <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between">
            <LocaleSwitcher />
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
              {getShellText("adminBadge")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <AdminIcon size={18} aria-hidden="true" />
            </div>
            <span className="text-xs font-bold text-on-surface">
              {getShellText("adminPanel")}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto text-start">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
