"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface ClinicalHeaderProps {
  locale?: string;
}

export function ClinicalHeader({ locale = "fa" }: ClinicalHeaderProps) {
  const pathname = usePathname();

  const navLinks = [
    { label: "نوبت‌دهی پزشکان", href: `/${locale}/doctors` },
    { label: "خدمات درمانی", href: `/${locale}/services` },
    { label: "پرونده و تغذیه", href: `/${locale}/nutrition` },
    { label: "مجله سلامت", href: `/${locale}/articles` },
    { label: "درباره ما", href: `/${locale}/about` },
    { label: "تماس با ما", href: `/${locale}/contact` },
  ];

  const isItemActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md shadow-tier-1">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo & Desktop Navigation */}
        <div className="flex items-center gap-6 xl:gap-8">
          <Link
            href={`/${locale}`}
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-tier-1 transition-transform group-hover:scale-105">
              <ClinicalIcon name="local_hospital" size={24} fill />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-on-surface leading-tight tracking-tight">
                انگبین طب
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium leading-tight">
                سامانه سلامت و تغذیه بالینی
              </span>
            </div>
          </Link>

          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isItemActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-xs xl:text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action buttons & Utilities */}
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
          <div className="flex items-center rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-2 py-1 text-xs text-on-surface">
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
        </div>
      </div>
    </header>
  );
}
