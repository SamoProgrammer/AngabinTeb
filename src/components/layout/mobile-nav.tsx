"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDays, Headset, House, Stethoscope, Utensils, type LucideIcon } from "lucide-react";

export interface MobileNavProps {
  locale?: string;
}

export function MobileNav({ locale = "fa" }: MobileNavProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  const labels = {
    home: t("mobile.home"),
    doctors: t("mobile.doctors"),
    nutrition: t("mobile.nutrition"),
    appointments: t("mobile.appointments"),
    support: t("mobile.support"),
  };

  const items: Array<{ label: string; href: string; icon: LucideIcon; exact: boolean }> = [
    { label: labels.home, href: `/${locale}`, icon: House, exact: true },
    { label: labels.doctors, href: `/${locale}/booking/categories`, icon: Stethoscope, exact: false },
    { label: labels.nutrition, href: `/${locale}/diet`, icon: Utensils, exact: false },
    { label: labels.appointments, href: `/${locale}/profile`, icon: CalendarDays, exact: false },
    { label: labels.support, href: `/${locale}/notes/site-help`, icon: Headset, exact: false },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      dir={locale === "en" ? "ltr" : "rtl"}
      className="fixed bottom-0 inset-x-0 z-50 md:hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-md shadow-tier-2"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const isActive = Boolean(
            pathname &&
              (item.exact
                ? pathname === item.href || pathname === `/${locale}/` || pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`))
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <item.icon
                size={22}
                fill={isActive ? "currentColor" : "none"}
                className={isActive ? "text-primary scale-105 transition-transform" : "text-on-surface-variant"}
                aria-hidden="true"
              />
              <span className="text-[11px] mt-0.5 leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
