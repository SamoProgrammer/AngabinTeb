"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { resolveIcon } from "@/components/clinical/icons";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOut } from "@/lib/auth-client";

export interface UserShellBadges {
  reservations?: number;
  messages?: number;
  notifications?: number;
  diets?: number;
}

export interface UserShellProps {
  children: ReactNode;
  activePath?: string;
  locale?: string;
  badges?: UserShellBadges;
}

interface UserNavItem {
  href: string;
  key: string;
  icon: string;
  badge?: keyof UserShellBadges;
}

interface UserNavGroup {
  key: string;
  labelKey: string;
  items: UserNavItem[];
}

export function matchesUserItem(href: string, currentPath: string) {
  return currentPath === href || currentPath.endsWith(href) || currentPath.includes(href);
}

export const USER_NAV_GROUPS: UserNavGroup[] = [
  { key: "overview", labelKey: "account.shell.groups.overview", items: [{ href: "/profile", key: "dashboard", icon: "dashboard" }] },
  { key: "booking", labelKey: "account.shell.groups.booking", items: [{ href: "/profile/reservations", key: "reservations", icon: "calendar_check", badge: "reservations" as const }] },
  { key: "nutrition", labelKey: "account.shell.groups.nutrition", items: [
    { href: "/profile/diets", key: "diets", icon: "restaurant", badge: "diets" as const },
    { href: "/profile/calorie", key: "calorie", icon: "calculator" },
    { href: "/profile/body", key: "body", icon: "monitor_weight" },
    { href: "/profile/clinical", key: "clinical", icon: "fact_check" },
  ]},
  { key: "messages", labelKey: "account.shell.groups.messages", items: [
    { href: "/profile/messages", key: "messages", icon: "mail", badge: "messages" as const },
    { href: "/notifications", key: "notifications", icon: "notifications", badge: "notifications" as const },
    { href: "/support/requests", key: "support", icon: "support_agent" },
  ]},
  { key: "account", labelKey: "account.shell.groups.account", items: [
    { href: "/profile/personal-info", key: "personalInfo", icon: "person" },
    { href: "/profile/balance", key: "balance", icon: "wallet" },
  ]},
];

const USER_NAV_ITEMS = USER_NAV_GROUPS.flatMap((group) => group.items);

const NAV_FALLBACK_FA: Record<string, string> = {
  overview: "نمای کلی",
  booking: "نوبت‌ها",
  nutrition: "تغذیه",
  messages: "پیام‌ها",
  account: "حساب",
  dashboard: "پیشخوان",
  reservations: "نوبت‌های من",
  diets: "رژیم‌های من",
  calorie: "کالری",
  body: "وضعیت بدنی",
  clinical: "پرونده بالینی",
  notifications: "اعلان‌ها",
  support: "پشتیبانی",
  personalInfo: "اطلاعات فردی",
  balance: "کیف پول",
};

const SHELL_LABELS = {
  dashboard: { fa: "پنل من", en: "My panel", ar: "لوحتي" },
  brand: { fa: "انگبین طب", en: "Angabin Teb", ar: "أنغبين طب" },
  portalLink: { fa: "بازگشت به پورتال", en: "Back to portal", ar: "العودة إلى البوابة" },
  signOut: { fa: "خروج", en: "Sign out", ar: "تسجيل الخروج" },
  openMenu: { fa: "باز کردن منو", en: "Open menu", ar: "فتح القائمة" },
  closeMenu: { fa: "بستن منو", en: "Close menu", ar: "إغلاق القائمة" },
};

export function UserShell({ children, activePath, locale, badges }: UserShellProps) {
  // Navigation-driven highlight: explicit prop wins (tests/embeds),
  // otherwise track the real route so the sidebar follows navigation.
  const pathname = usePathname();
  const currentPath = activePath ?? pathname ?? "/profile";
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
  try {
    tShell = useTranslations("account.shell");
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

  const getNavText = (groupKey: string, itemKey: string, fallback: string) => {
    if (tShell) {
      const trans = tShell(itemKey ? `items.${itemKey}` : `groups.${groupKey}`);
      if (trans && !trans.includes("items.") && !trans.includes("groups.")) return trans;
    }
    return NAV_FALLBACK_FA[itemKey || groupKey] ?? fallback;
  };

  // Longest-href-wins: on /profile/diets/abc both /profile and /profile/diets
  // prefix-match, but the longer diets href wins so the dashboard never lights
  // up on a child route. /profile matches exactly only.
  const matchesItem = (href: string) => {
    if (href === "/profile") {
      return currentPath === href || currentPath === `${prefix}/profile`;
    }
    return (
      currentPath === href ||
      currentPath === `${prefix}${href}` ||
      currentPath.startsWith(`${href}/`) ||
      currentPath.startsWith(`${prefix}${href}/`)
    );
  };
  const activeHref = USER_NAV_ITEMS.filter((item) => matchesItem(item.href)).sort(
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
  const UserIcon = resolveIcon("person");
  const MenuIcon = resolveIcon("menu");
  const CloseIcon = resolveIcon("close");
  const LogoutIcon = resolveIcon("logout");

  const renderNavGroups = () => (
    <div className="flex flex-col gap-4">
      {USER_NAV_GROUPS.map((group) => (
        <section key={group.key} aria-label={getNavText(group.key, "", group.key)}>
          <h2 className="px-3.5 pb-1.5 text-[11px] font-bold text-on-surface-variant/70">
            {getNavText(group.key, "", group.key)}
          </h2>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const itemHref = `${prefix}${item.href}`;
              const isActive = activeHref === item.href;
              const localizedLabel = getNavText(group.key, item.key, item.key);
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
      {/* User Dashboard Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 bg-surface-container-lowest border-e border-outline-variant/30 flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Dashboard Header Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/20">
            <Link href={`${prefix}/profile`} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
                <BrandIcon size={18} aria-hidden="true" />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-extrabold text-sm text-primary">
                  {getShellText("dashboard")}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {getShellText("brand")}
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 text-start overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar" aria-label="Dashboard">
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
                {getShellText("dashboard")}
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
            <nav className="p-3 text-start overflow-y-auto flex-1" aria-label="Dashboard">{renderNavGroups()}</nav>
            <div className="p-4 border-t border-outline-variant/20">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      ) : null}

      {/* Main User Content Canvas */}
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
              {getShellText("dashboard")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <UserIcon size={18} aria-hidden="true" />
            </div>
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
