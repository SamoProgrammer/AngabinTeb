"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Accessibility, BookOpen, Flame, NotebookPen, type LucideIcon } from "lucide-react";

export interface NutritionNavProps {
  locale?: string;
  className?: string;
}

export function NutritionNav({ locale = "fa", className = "" }: NutritionNavProps) {
  const pathname = usePathname() || "";
  const t = useTranslations("nutrition");

  const navItems: Array<{
    label: string;
    href: string;
    icon: LucideIcon;
    isActive: boolean;
  }> = [
    {
      label: t("calorie"),
      href: `/${locale}/nutrition/calorie`,
      icon: Flame,
      isActive: pathname.includes("/calorie"),
    },
    {
      label: t("diet"),
      href: `/${locale}/nutrition/diet`,
      icon: NotebookPen,
      isActive: pathname.includes("/diet"),
    },
    {
      label: t("body"),
      href: `/${locale}/nutrition/body`,
      icon: Accessibility,
      isActive: pathname.includes("/body"),
    },
    {
      label: t("foods"),
      href: `/${locale}/foods`,
      icon: BookOpen,
      isActive: pathname.includes("/foods"),
    },
  ];

  return (
    <div className={`flex flex-col gap-2 mb-6 sm:mb-8 ${className}`}>
      <nav
        aria-label={t("navAria")}
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-3 no-scrollbar border-b border-outline-variant/30"
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
            <item.icon
              size={18}
              className={item.isActive ? "text-on-primary" : "text-primary"}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
