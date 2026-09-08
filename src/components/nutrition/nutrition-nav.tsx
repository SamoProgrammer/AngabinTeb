"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Accessibility, ArrowLeftRight, BookOpen, LayoutDashboard, NotebookPen, Utensils, type LucideIcon } from "lucide-react";

export interface NutritionNavProps {
  locale?: string;
  className?: string;
}

export function NutritionNav({ locale = "fa", className = "" }: NutritionNavProps) {
  const pathname = usePathname() || "";
  const t = useTranslations("nutrition");
  const isEn = locale === "en";

  const labels = {
    overview: t("overview"),
    overviewStep: t("overviewStep"),
    body: t("body"),
    bodyStep: t("bodyStep"),
    diet: t("diet"),
    dietStep: t("dietStep"),
    diary: t("diary"),
    diaryStep: t("diaryStep"),
    foods: t("foods"),
    foodsStep: t("foodsStep"),
    cycleTitle: t("cycleTitle"),
    cycleSteps: [
      t("cycleStep1"),
      isEn ? "→" : "←",
      t("cycleStep2"),
      isEn ? "→" : "←",
      t("cycleStep3"),
      isEn ? "→" : "←",
      t("cycleStep4"),
    ],
    navAria: t("navAria"),
  };

  const navItems: Array<{
    step: string;
    label: string;
    href: string;
    icon: LucideIcon;
    isActive: boolean;
  }> = [
    {
      step: labels.overviewStep,
      label: labels.overview,
      href: `/${locale}/nutrition`,
      icon: LayoutDashboard,
      isActive:
        pathname.endsWith("/nutrition") ||
        pathname === `/${locale}` ||
        (!pathname.includes("/body") &&
          !pathname.includes("/diary") &&
          !pathname.includes("/diet") &&
          !pathname.includes("/foods")),
    },
    {
      step: labels.bodyStep,
      label: labels.body,
      href: `/${locale}/nutrition/body`,
      icon: Accessibility,
      isActive: pathname.includes("/body"),
    },
    {
      step: labels.dietStep,
      label: labels.diet,
      href: `/${locale}/nutrition/diet`,
      icon: NotebookPen,
      isActive: pathname.includes("/diet"),
    },
    {
      step: labels.diaryStep,
      label: labels.diary,
      href: `/${locale}/nutrition/diary`,
      icon: Utensils,
      isActive: pathname.includes("/diary"),
    },
    {
      step: labels.foodsStep,
      label: labels.foods,
      href: `/${locale}/nutrition/foods`,
      icon: BookOpen,
      isActive: pathname.includes("/foods"),
    },
  ];

  return (
    <div className={`flex flex-col gap-2 mb-6 sm:mb-8 ${className}`}>
      {/* Visual Subsystem Journey Guide */}
      <div className="hidden sm:flex items-center justify-between px-1 text-xs text-on-surface-variant font-medium">
        <div className="flex items-center gap-1.5 text-primary font-bold">
          <ArrowLeftRight size={16} aria-hidden="true" />
          <span>{labels.cycleTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {labels.cycleSteps.map((s, idx) => (
            <span key={idx}>{s}</span>
          ))}
        </div>
      </div>

      <nav
        aria-label={labels.navAria}
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
            <div className="flex items-center gap-1.5">
              <span>{item.label}</span>
              <span
                className={`hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded-md ${
                  item.isActive
                    ? "bg-on-primary/20 text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {item.step}
              </span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
