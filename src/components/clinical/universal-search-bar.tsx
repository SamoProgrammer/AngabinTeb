"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export type SearchCategory = "doctors" | "services" | "nutrition" | "articles";

export interface UniversalSearchBarProps {
  locale?: string;
  initialQuery?: string;
  initialCategory?: SearchCategory;
  onSearch?: (query: string, category: SearchCategory) => void;
  className?: string;
  showGuarantees?: boolean;
}

interface TabConfig {
  id: SearchCategory;
  label: string;
  icon: string;
  placeholder: string;
  routePath: string;
}

const TABS: TabConfig[] = [
  {
    id: "doctors",
    label: "پزشکان و متخصصان",
    icon: "stethoscope",
    placeholder: "جستجوی نام پزشک، تخصص (مانند گوارش، قلب، غدد)...",
    routePath: "doctors",
  },
  {
    id: "services",
    label: "خدمات پاراکلینیک",
    icon: "science",
    placeholder: "جستجوی خدمات پاراکلینیک، آزمایش خون، چکاپ، تصویربرداری...",
    routePath: "services",
  },
  {
    id: "nutrition",
    label: "رژیم و کالری‌شمار",
    icon: "restaurant",
    placeholder: "جستجوی غذاها، کالری مواد غذایی، برنامه‌های رژیمی...",
    routePath: "nutrition",
  },
  {
    id: "articles",
    label: "مقالات سلامت",
    icon: "menu_book",
    placeholder: "جستجوی مقالات پزشکی، بیماری‌ها، راهنمای سلامت...",
    routePath: "articles",
  },
];

export function UniversalSearchBar({
  locale = "fa",
  initialQuery = "",
  initialCategory = "doctors",
  onSearch,
  className = "",
  showGuarantees = true,
}: UniversalSearchBarProps) {
  const [activeTab, setActiveTab] = useState<SearchCategory>(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const currentTab = TABS.find((t) => t.id === activeTab) ?? TABS[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (onSearch) {
      onSearch(trimmed, activeTab);
      return;
    }
    const params = trimmed ? `?q=${encodeURIComponent(trimmed)}` : "";
    router.push(`/${locale}/${currentTab.routePath}${params}`);
  };

  return (
    <div className={`w-full ${className}`} dir="rtl">
      {/* Search card container */}
      <div className="w-full bg-surface-container-lowest rounded-3xl shadow-tier-1 p-4 sm:p-6 border border-outline-variant/30 transition-shadow hover:shadow-tier-2">
        {/* Category Tabs */}
        <div
          role="tablist"
          aria-label="دسته‌بندی جستجو"
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <ClinicalIcon name={tab.icon} size={18} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          aria-label="فرم جستجوی یکپارچه"
          className="flex flex-col md:flex-row items-center gap-3"
        >
          <div className="relative w-full flex items-center bg-surface-container-low rounded-2xl px-4 py-2 transition-colors focus-within:bg-surface-container focus-within:ring-2 focus-within:ring-primary/20">
            <ClinicalIcon
              name="search"
              size={24}
              className="text-primary me-2 shrink-0"
            />
            <input
              id="main-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentTab.placeholder}
              aria-label={currentTab.placeholder}
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none py-1 pe-2"
            />
            <button
              type="button"
              aria-label="جستجوی صوتی"
              title="جستجوی صوتی"
              className="text-on-surface-variant/50 hover:text-on-surface transition-colors p-1 cursor-pointer shrink-0"
            >
              <ClinicalIcon name="mic" size={20} />
            </button>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-medium px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all h-12 cursor-pointer"
          >
            <span>جستجوی هوشمند</span>
            <ClinicalIcon name="arrow_back" size={20} className="shrink-0" />
          </button>
        </form>
      </div>

      {/* Trust Guarantees Row */}
      {showGuarantees && (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-4 text-on-surface-variant text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <ClinicalIcon name="check_circle" size={18} className="text-primary shrink-0" />
            <span>بدون کارمزد آنلاین (پرداخت در مطب)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClinicalIcon name="verified" size={18} className="text-primary shrink-0" />
            <span>تضمین نوبت پزشک با پروانه رسمی</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClinicalIcon name="support_agent" size={18} className="text-primary shrink-0" />
            <span>پشتیبانی تلفنی و همراهی بیمار</span>
          </div>
        </div>
      )}
    </div>
  );
}
