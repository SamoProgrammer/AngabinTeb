"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  Badge,
  BookOpen,
  Calculator,
  CalendarCheck,
  ChevronDown,
  CircleHelp,
  FilePenLine,
  FileQuestion,
  FileText,
  Gavel,
  Handshake,
  Hospital,
  Info,
  Languages,
  LayoutGrid,
  Mail,
  MapPin,
  Menu,
  Newspaper,
  OctagonAlert,
  ShieldCheck,
  Stethoscope,
  User,
  Utensils,
  Video,
  Wallet,
  X,
  Bell,
  Flower2,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export interface SubNavItem {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
}

export interface NavHub {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  items: SubNavItem[];
}

export interface ClinicalHeaderProps {
  locale?: string;
}

// Single nav structure: hub/item ids, icons, and route paths are written once.
// Localized labels and descriptions resolve from the "header" message catalog.
interface NavItemSkeleton {
  key: string;
  path: string;
  icon: LucideIcon;
}

interface NavHubSkeleton {
  id: string;
  icon: LucideIcon;
  path: string;
  items: NavItemSkeleton[];
}

const NAV_STRUCTURE: NavHubSkeleton[] = [
  {
    id: "booking",
    icon: Stethoscope,
    path: "/booking/categories",
    items: [
      { key: "categories", path: "/booking/categories", icon: LayoutGrid },
      { key: "doctors", path: "/booking/doctors", icon: Stethoscope },
      { key: "diagnostic", path: "/booking/diagnostic-services", icon: Atom },
    ],
  },
  {
    id: "nutrition",
    icon: Utensils,
    path: "/nutrition/diet",
    items: [
      { key: "diets", path: "/nutrition/diet", icon: Flower2 },
      { key: "foodAnalysis", path: "/nutrition/calorie", icon: Calculator },
      { key: "foods", path: "/foods", icon: Utensils },
      { key: "diary", path: "/nutrition/body", icon: FilePenLine },
    ],
  },
  {
    id: "content",
    icon: BookOpen,
    path: "/articles",
    items: [
      { key: "articles", path: "/articles", icon: Newspaper },
      { key: "nutritionKnowledge", path: "/nutrition-knowledge", icon: BookOpen },
      { key: "pamphlets", path: "/knowledge/pamphlet", icon: FileText },
      { key: "videos", path: "/knowledge/videos", icon: Video },
      { key: "faq", path: "/knowledge/faq", icon: FileQuestion },
    ],
  },
  {
    id: "support",
    icon: CircleHelp,
    path: "/about-us",
    items: [
      { key: "about", path: "/about-us", icon: Info },
      { key: "contact", path: "/contact-us", icon: MapPin },
      { key: "workWithUs", path: "/work-with-us", icon: Handshake },
      { key: "siteHelp", path: "/notes/site-help", icon: CircleHelp },
      { key: "complains", path: "/complains", icon: OctagonAlert },
      { key: "terms", path: "/terms-and-conditions", icon: Gavel },
    ],
  },
];

function getNavHubs(locale: string, t: (key: string) => string): NavHub[] {
  return NAV_STRUCTURE.map((hub) => ({
    id: hub.id,
    label: t(`hubs.${hub.id}.label`),
    href: `/${locale}${hub.path}`,
    icon: hub.icon,
    items: hub.items.map((item) => ({
      label: t(`hubs.${hub.id}.items.${item.key}.label`),
      href: `/${locale}${item.path}`,
      description: t(`hubs.${hub.id}.items.${item.key}.description`),
      icon: item.icon,
    })),
  }));
}

export function ClinicalHeader({ locale = "fa" }: ClinicalHeaderProps) {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedHub, setMobileExpandedHub] = useState<string | null>("booking");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const user = session?.user;
  const isAuthenticated = Boolean(user);
  const isAdmin = (user as { role?: string })?.role === "admin";

  const t = useTranslations("header");
  const tCommon = useTranslations("common");

  const navHubs = getNavHubs(locale, t);

  const brandTitle = t("brandTitle");
  const brandSubtitle = t("brandSubtitle");

  const loginLabel = tCommon("login");

  const userMenuLabels = {
    account: t("userMenu.account"),
    appointments: t("userMenu.appointments"),
    appointmentsDesc: t("userMenu.appointmentsDesc"),
    personalInfo: t("userMenu.personalInfo"),
    personalInfoDesc: t("userMenu.personalInfoDesc"),
    balance: t("userMenu.balance"),
    balanceDesc: t("userMenu.balanceDesc"),
    messages: t("userMenu.messages"),
    messagesDesc: t("userMenu.messagesDesc"),
    notifications: t("userMenu.notifications"),
    notificationsDesc: t("userMenu.notificationsDesc"),
    admin: t("userMenu.admin"),
    adminDesc: t("userMenu.adminDesc"),
    signOut: t("userMenu.signOut"),
    adminBadge: t("userMenu.adminBadge"),
    walletUnit: t("walletUnit"),
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    window.location.href = `/${locale}`;
  };

  // Close dropdowns and menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleMouseEnter = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(id);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const isHubActive = (hub: NavHub) => {
    if (!pathname) return false;
    if (pathname === hub.href || pathname.startsWith(`${hub.href}/`)) return true;
    return hub.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  };

  return (
    <header
      ref={headerRef}
      dir={locale === "en" ? "ltr" : "rtl"}
      className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/95 backdrop-blur-md shadow-tier-1 transition-all"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo & Desktop Mega-Dropdown Navigation */}
        <div className="flex items-center gap-4 lg:gap-8">
          <Link
            href={`/${locale}`}
            className="group flex items-center gap-3 transition-opacity hover:opacity-90 shrink-0"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-tier-1 transition-transform group-hover:scale-105">
              <Hospital size={24} fill="currentColor" aria-hidden="true" />
            </div>
            <div className="flex flex-col text-start">
              <span className="text-base sm:text-lg font-extrabold text-on-surface leading-tight tracking-tight">
                {brandTitle}
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium leading-tight hidden sm:inline">
                {brandSubtitle}
              </span>
            </div>
          </Link>

          {/* Desktop Dropdown Hubs */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navHubs.map((hub) => {
              const isOpen = activeDropdown === hub.id;
              const isActive = isHubActive(hub);

              return (
                <div
                  key={hub.id}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(hub.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : hub.id)}
                    aria-expanded={isOpen}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                      isActive || isOpen
                        ? "bg-primary/10 text-primary font-bold shadow-xs"
                        : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                    }`}
                  >
                    <span>{hub.label}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : "text-on-surface-variant/70"
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Dropdown Flyout Card (Digikala / Clinical Mega Style) */}
                  {isOpen && (
                    <div
                      role="menu"
                      className={`absolute top-full start-0 mt-2 ${
                        hub.items.length > 5 ? "w-80 sm:w-[540px] lg:w-[620px]" : "w-72 lg:w-80"
                      } bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-tier-2 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-start`}
                    >
                      <div className={hub.items.length > 5 ? "grid grid-cols-1 sm:grid-cols-2 gap-1.5" : "flex flex-col gap-1"}>
                        {hub.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={() => setActiveDropdown(null)}
                            className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-container-low transition-colors"
                          >
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                              <item.icon size={20} aria-hidden="true" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                                {item.label}
                              </span>
                              <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-1 mt-0.5">
                                {item.description}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Dropdown Footer Quick Link */}
                      <div className="mt-2 pt-2 border-t border-outline-variant/15 px-2 flex items-center justify-between text-[11px] text-primary font-semibold">
                        <Link
                          href={hub.href}
                          onClick={() => setActiveDropdown(null)}
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>
                            {t("viewAll", { hub: hub.label })}
                          </span>
                          {locale === "en" ? (
                            <ArrowRight size={14} aria-hidden="true" />
                          ) : (
                            <ArrowLeft size={14} aria-hidden="true" />
                          )}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Action Buttons & Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Locale switcher */}
          <div className="flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-on-surface">
            <Languages size={16} className="me-1 text-on-surface-variant" aria-hidden="true" />
            <LocaleSwitcher />
          </div>

          {/* Wallet Balance Badge */}
          {isAuthenticated && (
            <Link
              href={`/${locale}/profile/balance`}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/25 px-3 py-2 text-xs sm:text-sm font-bold text-primary transition-all shadow-xs"
              title={userMenuLabels.balance}
            >
              <Wallet size={16} fill="currentColor" aria-hidden="true" />
              <span>{locale === "en" ? "0" : locale === "ar" ? "٠" : "۰"} {userMenuLabels.walletUnit}</span>
            </Link>
          )}

          {/* Patient Auth CTA / User Account Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/25 px-3 py-2 text-xs sm:text-sm font-bold text-primary transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <User size={16} fill="currentColor" aria-hidden="true" />
                </div>
                <span className="max-w-[120px] truncate">
                  {user?.name || userMenuLabels.account}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {/* Dropdown Menu */}
              <div
                role="menu"
                className={`absolute top-full end-0 mt-2 w-72 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-tier-2 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-start ${
                  userMenuOpen ? "block" : "hidden"
                }`}
              >
                {/* User Info Header */}
                <div className="p-3 rounded-xl bg-surface-container-low/80 mb-1.5 border border-outline-variant/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
                      {user?.name || userMenuLabels.account}
                    </span>
                    {isAdmin && (
                      <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        {userMenuLabels.adminBadge}
                      </span>
                    )}
                  </div>
                  {user?.phoneNumber && (
                    <span className="text-[11px] text-on-surface-variant font-mono block mt-0.5" dir="ltr">
                      {user.phoneNumber}
                    </span>
                  )}
                </div>

                {/* Menu Links */}
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/${locale}/profile/reservations`}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                      <CalendarCheck size={18} aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {userMenuLabels.appointments}
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-1">
                        {userMenuLabels.appointmentsDesc}
                      </span>
                    </div>
                  </Link>

                  <Link
                    href={`/${locale}/profile/personal-info`}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                      <Badge size={18} aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {userMenuLabels.personalInfo}
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-1">
                        {userMenuLabels.personalInfoDesc}
                      </span>
                    </div>
                  </Link>

                  <Link
                    href={`/${locale}/profile/balance`}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                      <Wallet size={18} aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {userMenuLabels.balance}
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-1">
                        {userMenuLabels.balanceDesc}
                      </span>
                    </div>
                  </Link>

                  <Link
                    href={`/${locale}/profile/messages`}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                      <Mail size={18} aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {userMenuLabels.messages}
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-1">
                        {userMenuLabels.messagesDesc}
                      </span>
                    </div>
                  </Link>

                  {isAdmin && (
                    <Link
                      href={`/${locale}/admin`}
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                        <ShieldCheck size={18} aria-hidden="true" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {userMenuLabels.admin}
                        </span>
                        <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-1">
                          {userMenuLabels.adminDesc}
                        </span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-outline-variant/20 my-1.5" />

                {/* Sign Out Button */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 w-full p-2 rounded-xl text-error hover:bg-error-container/20 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-start"
                >
                  <LogOut size={18} aria-hidden="true" />
                  <span>{userMenuLabels.signOut}</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href={`/${locale}/signin`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-on-primary shadow-tier-1 hover:bg-primary-container active:translate-y-px transition-all"
            >
              <User size={18} fill="currentColor" aria-hidden="true" />
              <span>{loginLabel}</span>
            </Link>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t("menuAria")}
            className="md:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors"
          >
            {mobileMenuOpen ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (When hamburger clicked on phones) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface-container-lowest p-4 shadow-tier-2 animate-in slide-in-from-top-3 duration-200 text-start">
          {/* Authenticated user mobile card OR login button */}
          <div className="mb-4">
            {isAuthenticated ? (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/70 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
                      <User size={20} fill="currentColor" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-on-surface">
                        {user?.name || userMenuLabels.account}
                      </span>
                      {user?.phoneNumber && (
                        <span className="text-[11px] text-on-surface-variant font-mono" dir="ltr">
                          {user.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {userMenuLabels.adminBadge}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/20">
                  <Link
                    href={`/${locale}/profile/reservations`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <CalendarCheck size={16} className="text-primary" aria-hidden="true" />
                    <span>{userMenuLabels.appointments}</span>
                  </Link>
                  <Link
                    href={`/${locale}/notifications`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <Bell size={16} className="text-primary" aria-hidden="true" />
                    <span>{userMenuLabels.notifications}</span>
                  </Link>
                </div>

                {isAdmin && (
                  <Link
                    href={`/${locale}/admin`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/15 transition-colors"
                  >
                    <ShieldCheck size={16} aria-hidden="true" />
                    <span>{userMenuLabels.admin}</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-error hover:bg-error-container/20 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>{userMenuLabels.signOut}</span>
                </button>
              </div>
            ) : (
              <Link
                href={`/${locale}/signin`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold shadow-tier-1 hover:bg-primary-container transition-all"
              >
<User size={18} fill="currentColor" aria-hidden="true" />
                <span>{loginLabel}</span>
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {navHubs.map((hub) => {
              const isExpanded = mobileExpandedHub === hub.id;

              return (
                <div key={hub.id} className="border border-outline-variant/20 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMobileExpandedHub(isExpanded ? null : hub.id)}
                    className="w-full flex items-center justify-between p-3 bg-surface-container-low/60 text-xs font-bold text-on-surface cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <hub.icon size={18} className="text-primary" aria-hidden="true" />
                      <span>{hub.label}</span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`transition-transform duration-200 ${isExpanded ? "rotate-180 text-primary" : "text-outline"}`}
                      aria-hidden="true"
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-2 flex flex-col gap-1.5 bg-surface-container-lowest">
                      {hub.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low text-xs text-on-surface transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon size={16} className="text-primary" aria-hidden="true" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
