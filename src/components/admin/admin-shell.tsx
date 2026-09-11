"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { resolveIcon } from "@/components/clinical/icons";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOut } from "@/lib/auth-client";

export interface AdminShellBadges {
  claims?: number;
  support?: number;
}

export interface AdminShellProps {
  children: ReactNode;
  activePath?: string;
  locale?: string;
  badges?: AdminShellBadges;
}

interface AdminNavItem {
  href: string;
  key: string;
  label: string;
  icon: string;
  badge?: keyof AdminShellBadges;
}

interface AdminNavGroup {
  key: string;
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: "operations",
    label: "عملیات",
    items: [
      { href: "/admin", key: "dashboard", label: "داشبورد عملیات", icon: "dashboard" },
      {
        href: "/admin/diet-programs/claims",
        key: "claims",
        label: "صف درخواست‌های رژیم",
        icon: "fact_check",
        badge: "claims",
      },
      {
        href: "/admin/support",
        key: "support",
        label: "پشتیبانی و تیکت‌ها",
        icon: "support_agent",
        badge: "support",
      },
    ],
  },
  {
    key: "catalog",
    label: "کاتالوگ",
    items: [
      { href: "/admin/providers", key: "providers", label: "پزشکان و ارائه‌دهندگان", icon: "stethoscope" },
      { href: "/admin/services", key: "services", label: "خدمات و آزمایش‌ها", icon: "medical_services" },
      { href: "/admin/categories", key: "categories", label: "دسته‌بندی خدمات", icon: "category" },
      { href: "/admin/locations", key: "locations", label: "مراکز و کلینیک‌ها", icon: "location_on" },
    ],
  },
  {
    key: "knowledge",
    label: "دانش",
    items: [
      { href: "/admin/content", key: "content", label: "مدیریت مقالات و مدیا", icon: "article" },
      { href: "/admin/topics", key: "topics", label: "مراکز سلامت ۳۶۰°", icon: "hub" },
      { href: "/admin/foods", key: "foods", label: "بانک خوراک‌های ایرانی", icon: "restaurant" },
      { href: "/admin/diet-programs", key: "dietPrograms", label: "برنامه‌های تغذیه", icon: "menu_book" },
    ],
  },
  {
    key: "system",
    label: "سامانه",
    items: [{ href: "/admin/settings", key: "settings", label: "تنظیمات سامانه", icon: "settings" }],
  },
];

const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

const SHELL_LABELS = {
  consoleTitle: { fa: "کنسول مدیریت بالینی", en: "Clinical Admin Console", ar: "وحدة الإدارة السريرية" },
  brand: { fa: "انگبین طب", en: "Angabin Teb", ar: "أنغبين طب" },
  portalLink: { fa: "مشاهده پورتال اصلی", en: "View Main Portal", ar: "عرض البوابة الرئيسية" },
  adminBadge: { fa: "مدیر ارشد سامانه", en: "Chief System Administrator", ar: "المدير العام للنظام" },
  adminPanel: { fa: "پنل مدیر", en: "Admin Panel", ar: "لوحة المسؤول" },
  signOut: { fa: "خروج", en: "Sign out", ar: "تسجيل الخروج" },
  openMenu: { fa: "باز کردن منو", en: "Open menu", ar: "فتح القائمة" },
  closeMenu: { fa: "بستن منو", en: "Close menu", ar: "إغلاق القائمة" },
};

export function AdminShell({ children, activePath, locale, badges }: AdminShellProps) {
  // Navigation-driven highlight: explicit prop wins (tests/embeds),
  // otherwise track the real route so the sidebar follows navigation.
  const pathname = usePathname();
  const currentPath = activePath ?? pathname ?? "/admin";
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // Longest-href-wins: on /admin/diet-programs/claims both claims and
  // diet-programs prefix-match, but the longer claims href wins so the
  // parent list never lights up. /admin matches exactly only.
  const matchesItem = (href: string) => {
    if (href === "/admin") {
      return currentPath === href || currentPath === `${prefix}/admin`;
    }
    return (
      currentPath === href ||
      currentPath === `${prefix}${href}` ||
      currentPath.startsWith(`${href}/`) ||
      currentPath.startsWith(`${prefix}${href}/`)
    );
  };
  const activeHref = ADMIN_NAV_ITEMS.filter((item) => matchesItem(item.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0]?.href;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    window.location.assign(prefix);
  };

  const BrandIcon = resolveIcon("spa");
  const PortalIcon = resolveIcon(isRtl ? "arrow_forward" : "arrow_back");
  const AdminIcon = resolveIcon("person");
  const MenuIcon = resolveIcon("menu");
  const CloseIcon = resolveIcon("close");
  const LogoutIcon = resolveIcon("logout");

  const renderNavGroups = () => (
    <div className="flex flex-col gap-4">
      {ADMIN_NAV_GROUPS.map((group) => (
        <section key={group.key} aria-label={getNavText(`groups.${group.key}`, group.label)}>
          <h2 className="px-3.5 pb-1.5 text-[11px] font-bold text-on-surface-variant/70">
            {getNavText(`groups.${group.key}`, group.label)}
          </h2>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const itemHref = `${prefix}${item.href}`;
              const isActive = activeHref === item.href;
              const localizedLabel = getNavText(item.key, item.label);
              const ItemIcon = resolveIcon(item.icon);
              const count = item.badge ? (badges?.[item.badge] ?? 0) : 0;

              return (
                <Link
                  key={item.href}
                  href={itemHref}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs font-bold"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <ItemIcon size={20} aria-hidden="true" />
                  <span>{localizedLabel}</span>
                  {count > 0 ? (
                    <span className="ms-auto min-w-5 h-5 px-1.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold flex items-center justify-center">
                      {count}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="flex min-h-screen bg-surface">
      {/* Admin Clinical Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 bg-surface-container-lowest border-e border-outline-variant/30 flex-col justify-between shrink-0 shadow-xs">
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
          <nav className="p-3 text-start overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            {renderNavGroups()}
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

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={getShellText("closeMenu")}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] bg-surface-container-lowest border-e border-outline-variant/30 shadow-tier-3 flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/20">
              <span className="font-extrabold text-sm text-primary">
                {getShellText("consoleTitle")}
              </span>
              <button
                type="button"
                aria-label={getShellText("closeMenu")}
                onClick={() => setDrawerOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <CloseIcon size={20} aria-hidden="true" />
              </button>
            </div>
            <nav className="p-3 text-start overflow-y-auto flex-1">{renderNavGroups()}</nav>
            <div className="p-4 border-t border-outline-variant/20">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Admin Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={getShellText("openMenu")}
              onClick={() => setDrawerOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
            >
              <MenuIcon size={20} aria-hidden="true" />
            </button>
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
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              <LogoutIcon size={16} aria-hidden="true" />
              <span>{getShellText("signOut")}</span>
            </button>
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
