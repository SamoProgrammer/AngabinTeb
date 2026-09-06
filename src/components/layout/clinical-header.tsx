"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { authClient } from "@/lib/auth-client";

export interface SubNavItem {
  label: string;
  href: string;
  description: string;
  icon: string;
}

export interface NavHub {
  id: string;
  label: string;
  href: string;
  icon: string;
  items: SubNavItem[];
}

export interface ClinicalHeaderProps {
  locale?: string;
}

type LocaleKey = "fa" | "en" | "ar";

function asLocaleKey(locale: string): LocaleKey {
  return locale === "en" || locale === "ar" ? locale : "fa";
}

// Single nav structure: hub/item ids, icons, and route paths are written once.
// Localized labels, descriptions, and badges live in NAV_STRINGS below, keyed by hub id + item key.
interface NavItemSkeleton {
  key: string;
  path: string;
  icon: string;
}

interface NavHubSkeleton {
  id: string;
  icon: string;
  path: string;
  items: NavItemSkeleton[];
}

const NAV_STRUCTURE: NavHubSkeleton[] = [
  {
    id: "booking",
    icon: "stethoscope",
    path: "/doctors",
    items: [
      { key: "doctors", path: "/doctors", icon: "stethoscope" },
      { key: "services", path: "/services", icon: "medical_services" },
      { key: "topics", path: "/topics", icon: "hub" },
    ],
  },
  {
    id: "nutrition",
    icon: "restaurant",
    path: "/nutrition",
    items: [
      { key: "dashboard", path: "/nutrition", icon: "calculate" },
      { key: "diary", path: "/diary", icon: "edit_note" },
      { key: "diet", path: "/diet", icon: "menu_book" },
      { key: "foods", path: "/foods", icon: "restaurant" },
    ],
  },
  {
    id: "content",
    icon: "menu_book",
    path: "/articles",
    items: [
      { key: "articles", path: "/articles", icon: "article" },
      { key: "videos", path: "/videos", icon: "videocam" },
      { key: "conditions", path: "/conditions/diabetes", icon: "vital_signs" },
    ],
  },
  {
    id: "support",
    icon: "help",
    path: "/faq",
    items: [
      { key: "faq", path: "/faq", icon: "quiz" },
      { key: "support", path: "/support", icon: "support_agent" },
      { key: "contact", path: "/contact", icon: "location_on" },
      { key: "about", path: "/about", icon: "info" },
    ],
  },
];

interface NavItemStrings {
  label: string;
  description: string;
}

interface NavHubStrings {
  label: string;
  items: Record<string, NavItemStrings>;
}

const NAV_STRINGS: Record<LocaleKey, Record<string, NavHubStrings>> = {
  en: {
    booking: {
      label: "Appointments & Services",
      items: {
        doctors: {
          label: "Doctors & Specialists",
          description: "Search and book board-certified physicians and clinics",
        },
        services: {
          label: "Clinical & Diagnostic Services",
          description: "Ultrasound, ECG, laboratory tests, and routine checkups",
        },
        topics: {
          label: "360° Health Topics",
          description: "Integrated care pathways for diabetes, cardiovascular, fatty liver",
        },
      },
    },
    nutrition: {
      label: "Nutrition & Records",
      items: {
        dashboard: {
          label: "Metabolic Dashboard & BMR",
          description: "Calculate BMR/TDEE, target weight, and daily calorie targets",
        },
        diary: {
          label: "Daily Food Diary",
          description: "Log meals with traditional and metric portion measurements",
        },
        diet: {
          label: "Clinical Diet Plans",
          description: "Nutritional protocols for glucose control, fatty liver, weight loss",
        },
        foods: {
          label: "Nutritional Food Database",
          description: "Macro and micronutrient nutritional values for Iranian foods",
        },
      },
    },
    content: {
      label: "Health Knowledge",
      items: {
        articles: {
          label: "Clinical Articles",
          description: "Latest peer-reviewed medical articles and clinical research",
        },
        videos: {
          label: "Videos & Webinars",
          description: "Visual consultations and educational self-care video guides",
        },
        conditions: {
          label: "Conditions & Symptoms",
          description: "Clinical root causes, warning signs, and recommended labs",
        },
      },
    },
    support: {
      label: "Support & Guide",
      items: {
        faq: {
          label: "Frequently Asked Questions",
          description: "Instant answers about insurances, in-clinic payment, and bookings",
        },
        support: {
          label: "Support Center & Tickets",
          description: "Submit messages, follow up care requests, and connect with staff",
        },
        contact: {
          label: "Contact & Locations",
          description: "Clinic addresses, branch phone numbers, and reception desks",
        },
        about: {
          label: "About Us",
          description: "Clinical mission, medical ethics charter, and advisory council",
        },
      },
    },
  },
  ar: {
    booking: {
      label: "المواعيد والخدمات",
      items: {
        doctors: {
          label: "الأطباء والاستشاريون",
          description: "البحث وحجز المواعيد مع كبار الأطباء والمراكز",
        },
        services: {
          label: "الخدمات السريرية والتشخيصية",
          description: "الموجات فوق الصوتية، تخطيط القلب، والتحاليل الدورية",
        },
        topics: {
          label: "محاور الصحة ۳۶۰°",
          description: "مسارات الرعاية الشاملة للسكري، القلب والكبد الدهني",
        },
      },
    },
    nutrition: {
      label: "الملف والتغذية",
      items: {
        dashboard: {
          label: "لوحة الأيض والسعرات",
          description: "حساب معدل الأيض الأساسي BMR/TDEE والوزن المثالي",
        },
        diary: {
          label: "سجل الوجبات اليومي",
          description: "تسجيل الأطعمة وتتبع الوجبات الغذائية بمقاييس دقيقة",
        },
        diet: {
          label: "برامج الحمية العلاجية",
          description: "بروتوكولات تغذية لضبط السكر، الكبد وتخفيف الوزن",
        },
        foods: {
          label: "قاعدة بيانات الأغذية",
          description: "معلومات السعرات والقيم الغذائية للوجبات الإيرانية",
        },
      },
    },
    content: {
      label: "مجلة الصحة",
      items: {
        articles: {
          label: "المقالات الطبية المتخصصة",
          description: "أحدث المقالات السريرية والأبحاث الطبية المعتمدة",
        },
        videos: {
          label: "الفيديوهات والندوات",
          description: "استشارات مرئية وفيديوهات تعليمية للرعاية الذاتية",
        },
        conditions: {
          label: "الأعراض والأمراض",
          description: "استكشاف الأسباب السريرية، مؤشرات الخطر والفحوصات المقترحة",
        },
      },
    },
    support: {
      label: "الدليل والدعم",
      items: {
        faq: {
          label: "الأسئلة الشائعة (FAQ)",
          description: "إجابات فورية حول التأمين، الدفع في العيادة والحجوزات",
        },
        support: {
          label: "مركز الدعم والتذاكر",
          description: "إرسال الاستفسارات ومتابعة الطلبات مع فريق الدعم",
        },
        contact: {
          label: "اتصل بنا والفروع",
          description: "عناوين المراكز وأرقام الهواتف وخطوط الاستقبال",
        },
        about: {
          label: "عن انگبین طب",
          description: "الرسالة الطبية، الميثاق الأخلاقي واللجنة الاستشارية",
        },
      },
    },
  },
  // Default Persian
  fa: {
    booking: {
      label: "نوبت‌دهی و خدمات",
      items: {
        doctors: {
          label: "پزشکان و متخصصان",
          description: "جستجو و رزرو نوبت پزشکان فوق‌تخصص و مطب‌ها",
        },
        services: {
          label: "خدمات درمانی و تشخیصی",
          description: "سونوگرافی، نوار قلب، آزمایش‌ها و چکاپ‌های دوره‌ای",
        },
        topics: {
          label: "موضوعات و مراکز سلامت",
          description: "راهنماهای مراقبت دیابت، قلب و عروق و کبد چرب",
        },
      },
    },
    nutrition: {
      label: "پرونده و تغذیه",
      items: {
        dashboard: {
          label: "برنامه‌ها و ابزارهای تغذیه",
          description: "محاسبه BMR/TDEE، وزن ایده‌آل و بودجه کالری روزانه",
        },
        diary: {
          label: "دفترچه ثبت خوراک روزانه",
          description: "ثبت غذاها با پیمانه‌های معمول و پایش کالری",
        },
        diet: {
          label: "برنامه‌های رژیم بالینی",
          description: "برنامه‌های غذایی کنترل قند، کبد چرب و تناسب وزن",
        },
        foods: {
          label: "بانک ارزش غذایی خوراک‌ها",
          description: "بانک اطلاعات کالری و درشت‌مغذی‌های غذاها",
        },
      },
    },
    content: {
      label: "مجله سلامت",
      items: {
        articles: {
          label: "دانشنامه و مقالات سلامت",
          description: "مقالات کاربردی و توصیه‌های علمی تغذیه و سلامت",
        },
        videos: {
          label: "ویدیوها و وبینارها",
          description: "آموزش‌های ویدیویی خودمراقبتی و سلامت",
        },
        conditions: {
          label: "علائم و بیماری‌ها",
          description: "بررسی علل بالینی، نشانه‌های خطر و آزمایش‌های پیشنهادی",
        },
      },
    },
    support: {
      label: "راهنما و پشتیبانی",
      items: {
        faq: {
          label: "پرسش‌های متداول (FAQ)",
          description: "پاسخ سریع به سوالات بیمه‌ها، پرداخت در مطب و رزرو",
        },
        support: {
          label: "مرکز پشتیبانی و تیکت‌ها",
          description: "ارسال پیام، پیگیری درخواست‌ها و ارتباط با کارشناسان",
        },
        contact: {
          label: "تماس با ما و شعب",
          description: "آدرس و شماره تلفن کلینیک‌ها و خطوط پذیرش",
        },
        about: {
          label: "درباره ما",
          description: "رسالت بالینی، منشور اخلاقی و اعضای هیئت علمی",
        },
      },
    },
  },
};

function getNavHubs(locale: string): NavHub[] {
  const strings = NAV_STRINGS[asLocaleKey(locale)];
  return NAV_STRUCTURE.map((hub) => ({
    id: hub.id,
    label: strings[hub.id].label,
    href: `/${locale}${hub.path}`,
    icon: hub.icon,
    items: hub.items.map((item) => {
      const s = strings[hub.id].items[item.key];
      return {
        label: s.label,
        href: `/${locale}${item.path}`,
        description: s.description,
        icon: item.icon,
      };
    }),
  }));
}

interface UserMenuStrings {
  account: string;
  appointments: string;
  appointmentsDesc: string;
  notifications: string;
  notificationsDesc: string;
  admin: string;
  adminDesc: string;
  signOut: string;
  adminBadge: string;
}

const USER_MENU_LABELS: Record<LocaleKey, UserMenuStrings> = {
  fa: {
    account: "حساب کاربری",
    appointments: "نوبت‌های من",
    appointmentsDesc: "پیگیری، سوابق و جزئیات نوبت‌های رزرو شده",
    notifications: "پیام‌ها و اعلان‌ها",
    notificationsDesc: "یادآوری نوبت و وضعیت پرونده",
    admin: "پنل مدیریت",
    adminDesc: "مدیریت پزشکان، خدمات و گزارش‌ها",
    signOut: "خروج از حساب",
    adminBadge: "مدیر سامانه",
  },
  en: {
    account: "My Account",
    appointments: "My Appointments",
    appointmentsDesc: "Track and manage bookings",
    notifications: "Notifications",
    notificationsDesc: "Reminders and health alerts",
    admin: "Admin Dashboard",
    adminDesc: "Manage providers, services, and reports",
    signOut: "Sign Out",
    adminBadge: "Administrator",
  },
  ar: {
    account: "حسابي",
    appointments: "مواعيدي",
    appointmentsDesc: "متابعة وإدارة المواعيد المحجوزة",
    notifications: "الإشعارات",
    notificationsDesc: "تنبيهات المواعيد وتحديثات الملف",
    admin: "لوحة الإدارة",
    adminDesc: "إدارة الأطباء والخدمات والتقارير",
    signOut: "تسجيل الخروج",
    adminBadge: "مدير النظام",
  },
};

interface HeaderChromeStrings {
  brandTitle: string;
  brandSubtitle: string;
  login: string;
  viewAllPrefix: string;
  menuAria: string;
}

const HEADER_COPY: Record<LocaleKey, HeaderChromeStrings> = {
  en: {
    brandTitle: "Angabin Teb",
    brandSubtitle: "Clinical Health & Nutrition",
    login: "Sign In",
    viewAllPrefix: "View all in",
    menuAria: "Toggle menu",
  },
  ar: {
    brandTitle: "انگبین طب",
    brandSubtitle: "منصة الصحة والتغذية السريرية",
    login: "تسجيل الدخول",
    viewAllPrefix: "عرض جميع أقسام",
    menuAria: "منوی گزینه‌ها",
  },
  fa: {
    brandTitle: "انگبین طب",
    brandSubtitle: "سامانه سلامت و تغذیه بالینی",
    login: "ورود",
    viewAllPrefix: "مشاهده همه بخش‌های",
    menuAria: "منوی گزینه‌ها",
  },
};

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

  const userMenuLabels = USER_MENU_LABELS[asLocaleKey(locale)];

  const navHubs = getNavHubs(locale);

  const headerCopy = HEADER_COPY[asLocaleKey(locale)];
  const brandTitle = headerCopy.brandTitle;
  const brandSubtitle = headerCopy.brandSubtitle;

  const loginLabel = headerCopy.login;

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
              <ClinicalIcon name="local_hospital" size={24} fill />
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
                    <ClinicalIcon
                      name="expand_more"
                      size={16}
                      className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : "text-on-surface-variant/70"
                      }`}
                    />
                  </button>

                  {/* Dropdown Flyout Card (Digikala / Clinical Mega Style) */}
                  {isOpen && (
                    <div
                      role="menu"
                      className="absolute top-full start-0 mt-2 w-72 lg:w-80 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-tier-2 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-start"
                    >
                      <div className="flex flex-col gap-1">
                        {hub.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            role="menuitem"
                            onClick={() => setActiveDropdown(null)}
                            className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-surface-container-low transition-colors"
                          >
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                              <ClinicalIcon name={item.icon} size={20} />
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
                            {headerCopy.viewAllPrefix} {hub.label}
                          </span>
                          <ClinicalIcon
                            name={locale === "en" ? "arrow_forward" : "arrow_back"}
                            size={14}
                          />
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
            <ClinicalIcon name="language" size={16} className="me-1 text-on-surface-variant" />
            <LocaleSwitcher />
          </div>

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
                  <ClinicalIcon name="person" size={16} fill />
                </div>
                <span className="max-w-[120px] truncate">
                  {user?.name || userMenuLabels.account}
                </span>
                <ClinicalIcon
                  name="expand_more"
                  size={16}
                  className={`transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
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
                    href={`/${locale}/appointments`}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                      <ClinicalIcon name="event_available" size={18} />
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
                    href={`/${locale}/notifications`}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-surface-container-low transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                      <ClinicalIcon name="notifications" size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {userMenuLabels.notifications}
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-1">
                        {userMenuLabels.notificationsDesc}
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
                        <ClinicalIcon name="admin_panel_settings" size={18} />
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
                  <ClinicalIcon name="logout" size={18} />
                  <span>{userMenuLabels.signOut}</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href={`/${locale}/signin`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-on-primary shadow-tier-1 hover:bg-primary-container active:translate-y-px transition-all"
            >
              <ClinicalIcon name="person" size={18} fill />
              <span>{loginLabel}</span>
            </Link>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={headerCopy.menuAria}
            className="md:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <ClinicalIcon name={mobileMenuOpen ? "close" : "menu"} size={24} />
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
                      <ClinicalIcon name="person" size={20} fill />
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
                    href={`/${locale}/appointments`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <ClinicalIcon name="event_available" size={16} className="text-primary" />
                    <span>{userMenuLabels.appointments}</span>
                  </Link>
                  <Link
                    href={`/${locale}/notifications`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <ClinicalIcon name="notifications" size={16} className="text-primary" />
                    <span>{userMenuLabels.notifications}</span>
                  </Link>
                </div>

                {isAdmin && (
                  <Link
                    href={`/${locale}/admin`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:bg-primary/15 transition-colors"
                  >
                    <ClinicalIcon name="admin_panel_settings" size={16} />
                    <span>{userMenuLabels.admin}</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-error hover:bg-error-container/20 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <ClinicalIcon name="logout" size={16} />
                  <span>{userMenuLabels.signOut}</span>
                </button>
              </div>
            ) : (
              <Link
                href={`/${locale}/signin`}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold shadow-tier-1 hover:bg-primary-container transition-all"
              >
                <ClinicalIcon name="person" size={18} fill />
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
                      <ClinicalIcon name={hub.icon} size={18} className="text-primary" />
                      <span>{hub.label}</span>
                    </div>
                    <ClinicalIcon
                      name="expand_more"
                      size={18}
                      className={`transition-transform duration-200 ${isExpanded ? "rotate-180 text-primary" : "text-outline"}`}
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
                            <ClinicalIcon name={item.icon} size={16} className="text-primary" />
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
