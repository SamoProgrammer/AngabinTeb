"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

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

export function ClinicalHeader({ locale = "fa" }: ClinicalHeaderProps) {
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedHub, setMobileExpandedHub] = useState<string | null>("booking");
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  const navHubs: NavHub[] = [
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
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
      dir="rtl"
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
                انگبین طب
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium leading-tight hidden sm:inline">
                سامانه سلامت و تغذیه بالینی
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
                          <span>مشاهده همه بخش‌های {hub.label}</span>
                          <ClinicalIcon name="arrow_back" size={14} />
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
          {/* Emergency / Support Hotline */}
          <a
            href="tel:02188224000"
            className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <ClinicalIcon name="support_agent" size={18} className="text-primary" />
            <span>پشتیبانی فوری: ۰۲۱-۸۸۲۲۴۰۰۰</span>
          </a>

          {/* Locale switcher */}
          <div className="flex items-center rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-2 py-1 text-xs text-on-surface">
            <ClinicalIcon name="language" size={16} className="me-1 text-on-surface-variant" />
            <LocaleSwitcher />
          </div>

          {/* Patient Auth CTA */}
          <Link
            href={`/${locale}/appointments`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs sm:text-sm font-semibold text-on-primary shadow-tier-1 hover:bg-primary-container active:translate-y-px transition-all"
          >
            <ClinicalIcon name="person" size={18} fill />
            <span>ورود / پرونده من</span>
          </Link>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="منوی گزینه‌ها"
            className="md:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <ClinicalIcon name={mobileMenuOpen ? "close" : "menu"} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer (When hamburger clicked on phones) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface-container-lowest p-4 shadow-tier-2 animate-in slide-in-from-top-3 duration-200 text-start">
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
