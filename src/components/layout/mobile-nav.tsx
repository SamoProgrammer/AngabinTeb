"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface MobileNavProps {
  locale?: string;
}

export function MobileNav({ locale = "fa" }: MobileNavProps) {
  const pathname = usePathname();

  const items = [
    { label: "خانه", href: `/${locale}`, icon: "home", exact: true },
    { label: "پزشکان", href: `/${locale}/doctors`, icon: "stethoscope", exact: false },
    { label: "تغذیه", href: `/${locale}/nutrition`, icon: "nutrition", exact: false },
    { label: "نوبت‌ها", href: `/${locale}/appointments`, icon: "calendar_month", exact: false },
    { label: "پشتیبانی", href: `/${locale}/support`, icon: "support_agent", exact: false },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
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
              <ClinicalIcon
                name={item.icon}
                size={22}
                fill={isActive}
                className={isActive ? "text-primary scale-105 transition-transform" : "text-on-surface-variant"}
              />
              <span className="text-[11px] mt-0.5 leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
