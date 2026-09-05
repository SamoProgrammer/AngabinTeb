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
  badge?: string;
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

function getNavHubs(locale: string): NavHub[] {
  if (locale === "en") {
    return [
      {
        id: "booking",
        label: "Appointments & Services",
        href: `/${locale}/doctors`,
        icon: "stethoscope",
        items: [
          {
            label: "Doctors & Specialists",
            href: `/${locale}/doctors`,
            description: "Search and book board-certified physicians and clinics",
            icon: "stethoscope",
          },
          {
            label: "Clinical & Diagnostic Services",
            href: `/${locale}/services`,
            description: "Ultrasound, ECG, laboratory tests, and routine checkups",
            icon: "medical_services",
          },
          {
            label: "360° Health Topics",
            href: `/${locale}/topics`,
            description: "Integrated care pathways for diabetes, cardiovascular, fatty liver",
            icon: "hub",
          },
        ],
      },
      {
        id: "nutrition",
        label: "Nutrition & Records",
        href: `/${locale}/nutrition`,
        icon: "restaurant",
        items: [
          {
            label: "Metabolic Dashboard & BMR",
            href: `/${locale}/nutrition`,
            description: "Calculate BMR/TDEE, target weight, and daily calorie targets",
            icon: "calculate",
          },
          {
            label: "Daily Food Diary",
            href: `/${locale}/diary`,
            description: "Log meals with traditional and metric portion measurements",
            icon: "edit_note",
            badge: "Active",
          },
          {
            label: "Clinical Diet Plans",
            href: `/${locale}/diet`,
            description: "Nutritional protocols for glucose control, fatty liver, weight loss",
            icon: "menu_book",
          },
          {
            label: "Nutritional Food Database",
            href: `/${locale}/foods`,
            description: "Macro and micronutrient nutritional values for Iranian foods",
            icon: "restaurant",
          },
        ],
      },
      {
        id: "content",
        label: "Health Knowledge",
        href: `/${locale}/articles`,
        icon: "menu_book",
        items: [
          {
            label: "Clinical Articles",
            href: `/${locale}/articles`,
            description: "Latest peer-reviewed medical articles and clinical research",
            icon: "article",
          },
          {
            label: "Videos & Webinars",
            href: `/${locale}/videos`,
            description: "Visual consultations and educational self-care video guides",
            icon: "videocam",
          },
          {
            label: "Conditions & Symptoms",
            href: `/${locale}/conditions/diabetes`,
            description: "Clinical root causes, warning signs, and recommended labs",
            icon: "vital_signs",
          },
        ],
      },
      {
        id: "support",
        label: "Support & Guide",
        href: `/${locale}/faq`,
        icon: "help",
        items: [
          {
            label: "Frequently Asked Questions",
            href: `/${locale}/faq`,
            description: "Instant answers about insurances, in-clinic payment, and bookings",
            icon: "quiz",
            badge: "Instant",
          },
          {
            label: "Support Center & Tickets",
            href: `/${locale}/support`,
            description: "Submit messages, follow up care requests, and connect with staff",
            icon: "support_agent",
          },
          {
            label: "Contact & Locations",
            href: `/${locale}/contact`,
            description: "Clinic addresses, branch phone numbers, and reception desks",
            icon: "location_on",
          },
          {
            label: "About Us",
            href: `/${locale}/about`,
            description: "Clinical mission, medical ethics charter, and advisory council",
            icon: "info",
          },
        ],
      },
    ];
  }

  if (locale === "ar") {
    return [
      {
        id: "booking",
        label: "المواعيد والخدمات",
        href: `/${locale}/doctors`,
        icon: "stethoscope",
        items: [
          {
            label: "الأطباء والاستشاريون",
            href: `/${locale}/doctors`,
            description: "البحث وحجز المواعيد مع كبار الأطباء والمراكز",
            icon: "stethoscope",
          },
          {
            label: "الخدمات السريرية والتشخيصية",
            href: `/${locale}/services`,
            description: "الموجات فوق الصوتية، تخطيط القلب، والتحاليل الدورية",
            icon: "medical_services",
          },
          {
            label: "محاور الصحة ۳۶۰°",
            href: `/${locale}/topics`,
            description: "مسارات الرعاية الشاملة للسكري، القلب والكبد الدهني",
            icon: "hub",
          },
        ],
      },
      {
        id: "nutrition",
        label: "الملف والتغذية",
        href: `/${locale}/nutrition`,
        icon: "restaurant",
        items: [
          {
            label: "لوحة الأيض والسعرات",
            href: `/${locale}/nutrition`,
            description: "حساب معدل الأيض الأساسي BMR/TDEE والوزن المثالي",
            icon: "calculate",
          },
          {
            label: "سجل الوجبات اليومي",
            href: `/${locale}/diary`,
            description: "تسجيل الأطعمة وتتبع الوجبات الغذائية بمقاييس دقيقة",
            icon: "edit_note",
            badge: "عملي",
          },
          {
            label: "برامج الحمية العلاجية",
            href: `/${locale}/diet`,
            description: "بروتوكولات تغذية لضبط السكر، الكبد وتخفيف الوزن",
            icon: "menu_book",
          },
          {
            label: "قاعدة بيانات الأغذية",
            href: `/${locale}/foods`,
            description: "معلومات السعرات والقيم الغذائية للوجبات الإيرانية",
            icon: "restaurant",
          },
        ],
      },
      {
        id: "content",
        label: "مجلة الصحة",
        href: `/${locale}/articles`,
        icon: "menu_book",
        items: [
          {
            label: "المقالات الطبية المتخصصة",
            href: `/${locale}/articles`,
            description: "أحدث المقالات السريرية والأبحاث الطبية المعتمدة",
            icon: "article",
          },
          {
            label: "الفيديوهات والندوات",
            href: `/${locale}/videos`,
            description: "استشارات مرئية وفيديوهات تعليمية للرعاية الذاتية",
            icon: "videocam",
          },
          {
            label: "الأعراض والأمراض",
            href: `/${locale}/conditions/diabetes`,
            description: "استكشاف الأسباب السريرية، مؤشرات الخطر والفحوصات المقترحة",
            icon: "vital_signs",
          },
        ],
      },
      {
        id: "support",
        label: "الدليل والدعم",
        href: `/${locale}/faq`,
        icon: "help",
        items: [
          {
            label: "الأسئلة الشائعة (FAQ)",
            href: `/${locale}/faq`,
            description: "إجابات فورية حول التأمين، الدفع في العيادة والحجوزات",
            icon: "quiz",
            badge: "فوري",
          },
          {
            label: "مركز الدعم والتذاكر",
            href: `/${locale}/support`,
            description: "إرسال الاستفسارات ومتابعة الطلبات مع فريق الدعم",
            icon: "support_agent",
          },
          {
            label: "اتصل بنا والفروع",
            href: `/${locale}/contact`,
            description: "عناوين المراكز وأرقام الهواتف وخطوط الاستقبال",
            icon: "location_on",
          },
          {
            label: "عن انگبین طب",
            href: `/${locale}/about`,
            description: "الرسالة الطبية، الميثاق الأخلاقي واللجنة الاستشارية",
            icon: "info",
          },
        ],
      },
    ];
  }

  // Default Persian
  return [
    {
      id: "booking",
      label: "نوبت‌دهی و خدمات",
      href: `/${locale}/doctors`,
      icon: "stethoscope",
      items: [
        {
          label: "پزشکان و متخصصان",
          href: `/${locale}/doctors`,
          description: "جستجو و رزرو نوبت پزشکان فوق‌تخصص و مطب‌ها",
          icon: "stethoscope",
        },
        {
          label: "خدمات درمانی و پاراکلینیک",
          href: `/${locale}/services`,
          description: "سونوگرافی، نوار قلب، آزمایش‌ها و چکاپ‌های دوره‌ای",
          icon: "medical_services",
        },
        {
          label: "پایگاه‌های سلامت ۳۶۰°",
          href: `/${locale}/topics`,
          description: "مسیر مراقبت جامع دیابت، قلب و عروق و کبد چرب",
          icon: "hub",
        },
      ],
    },
    {
      id: "nutrition",
      label: "پرونده و تغذیه",
      href: `/${locale}/nutrition`,
      icon: "restaurant",
      items: [
        {
          label: "داشبورد متابولیک و کالری",
          href: `/${locale}/nutrition`,
          description: "محاسبه BMR/TDEE، وزن ایده‌آل و بودجه کالری روزانه",
          icon: "calculate",
        },
        {
          label: "دفترچه ثبت خوراک روزانه",
          href: `/${locale}/diary`,
          description: "ثبت غذاهای سفره ایرانی با پیمانه‌های سنتی (کفگیر، پیاله)",
          icon: "edit_note",
          badge: "کاربردی",
        },
        {
          label: "برنامه‌های رژیم بالینی",
          href: `/${locale}/diet`,
          description: "پروتکل‌های تغذیه‌ای کنترل قند، کبد چرب و کاهش وزن",
          icon: "menu_book",
        },
        {
          label: "بانک ارزش غذایی خوراک‌ها",
          href: `/${locale}/foods`,
          description: "پایگاه اطلاعات درشت‌مغذی‌ها و کالری غذاهای ایرانی",
          icon: "restaurant",
        },
      ],
    },
    {
      id: "content",
      label: "مجله سلامت",
      href: `/${locale}/articles`,
      icon: "menu_book",
      items: [
        {
          label: "مجله مقالات تخصصی",
          href: `/${locale}/articles`,
          description: "تازه‌ترین مقالات بالینی و پژوهش‌های علمی علوم پزشکی",
          icon: "article",
        },
        {
          label: "ویدیوها و وبینارها",
          href: `/${locale}/videos`,
          description: "مشاوره‌های تصویری و ویدیوهای آموزشی خودمراقبتی",
          icon: "videocam",
        },
        {
          label: "علائم و بیماری‌ها",
          href: `/${locale}/conditions/diabetes`,
          description: "بررسی علل بالینی، نشانه‌های خطر و آزمایش‌های پیشنهادی",
          icon: "vital_signs",
        },
      ],
    },
    {
      id: "support",
      label: "راهنما و پشتیبانی",
      href: `/${locale}/faq`,
      icon: "help",
      items: [
        {
          label: "پرسش‌های متداول (FAQ)",
          href: `/${locale}/faq`,
          description: "پاسخ سریع به سوالات بیمه‌ها، پرداخت در مطب و رزرو",
          icon: "quiz",
          badge: "پاسخ آنی",
        },
        {
          label: "مرکز پشتیبانی و تیکت‌ها",
          href: `/${locale}/support`,
          description: "ارسال پیام، پیگیری درخواست‌ها و ارتباط با کارشناسان",
          icon: "support_agent",
        },
        {
          label: "تماس با ما و شعب",
          href: `/${locale}/contact`,
          description: "آدرس و شماره تلفن کلینیک‌ها و خطوط پذیرش",
          icon: "location_on",
        },
        {
          label: "درباره ما",
          href: `/${locale}/about`,
          description: "رسالت بالینی، منشور اخلاقی و اعضای هیئت علمی",
          icon: "info",
        },
      ],
    },
  ];
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

  const userMenuLabels = {
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
  }[locale as "fa" | "en" | "ar"] || {
    account: "حساب کاربری",
    appointments: "نوبت‌های من",
    appointmentsDesc: "پیگیری، سوابق و جزئیات نوبت‌های رزرو شده",
    notifications: "پیام‌ها و اعلان‌ها",
    notificationsDesc: "یادآوری نوبت و وضعیت پرونده",
    admin: "پنل مدیریت",
    adminDesc: "مدیریت پزشکان، خدمات و گزارش‌ها",
    signOut: "خروج از حساب",
    adminBadge: "مدیر سامانه",
  };

  const navHubs = getNavHubs(locale);

  const brandTitle = locale === "en" ? "Angabin Teb" : "انگبین طب";
  const brandSubtitle =
    locale === "en"
      ? "Clinical Health & Nutrition"
      : locale === "ar"
        ? "منصة الصحة والتغذية السريرية"
        : "سامانه سلامت و تغذیه بالینی";

  const loginLabel = locale === "en" ? "Sign In" : locale === "ar" ? "تسجيل الدخول" : "ورود";

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
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className="bg-secondary/15 text-secondary text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
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
                            {locale === "en"
                              ? `View all in ${hub.label}`
                              : locale === "ar"
                                ? `عرض جميع أقسام ${hub.label}`
                                : `مشاهده همه بخش‌های ${hub.label}`}
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
            aria-label={locale === "en" ? "Toggle menu" : "منوی گزینه‌ها"}
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
                          {item.badge && (
                            <span className="bg-secondary/15 text-secondary text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {item.badge}
                            </span>
                          )}
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
