"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface NutritionNavProps {
  locale?: string;
  className?: string;
}

export function NutritionNav({ locale = "fa", className = "" }: NutritionNavProps) {
  const pathname = usePathname() || "";

  const navItems = [
    {
      label: "پیشخوان تغذیه",
      href: `/${locale}/nutrition`,
      icon: "dashboard",
      isActive:
        pathname.endsWith("/nutrition") ||
        pathname === `/${locale}` ||
        (!pathname.includes("/body") &&
          !pathname.includes("/diary") &&
          !pathname.includes("/diet") &&
          !pathname.includes("/foods")),
    },
    {
      label: "نمایه بدن من",
      href: `/${locale}/nutrition/body`,
      icon: "accessibility_new",
      isActive: pathname.includes("/body"),
    },
    {
      label: "دفترچه غذایی امروز",
      href: `/${locale}/nutrition/diary`,
      icon: "restaurant",
      isActive: pathname.includes("/diary"),
    },
    {
      label: "برنامه‌های رژیمی",
      href: `/${locale}/nutrition/diet`,
      icon: "clinical_notes",
      isActive: pathname.includes("/diet"),
    },
    {
      label: "بانک غذاهای ایرانی",
      href: `/${locale}/nutrition/foods`,
      icon: "menu_book",
      isActive: pathname.includes("/foods"),
    },
  ];

  return (
    <nav
      aria-label="ناوبری ماژول تغذیه و سلامت بالینی"
      className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 no-scrollbar border-b border-outline-variant/30 mb-6 sm:mb-8 ${className}`}
    >
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            item.isActive
              ? "bg-primary text-on-primary shadow-sm"
              : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          }`}
          aria-current={item.isActive ? "page" : undefined}
        >
          <ClinicalIcon
            name={item.icon}
            size={18}
            className={item.isActive ? "text-on-primary" : "text-primary"}
          />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
