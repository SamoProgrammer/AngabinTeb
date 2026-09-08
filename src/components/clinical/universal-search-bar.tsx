"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Atom, BadgeCheck, BookOpen, CircleCheckBig, Headset, Search, Stethoscope, Utensils, type LucideIcon } from "lucide-react";

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
  icon: LucideIcon;
  placeholder: string;
  routePath: string;
}

// Tab ids, icons, and route paths are static; labels and placeholders
// resolve from the "search" message catalog.
const TAB_IDS = [
  { id: "doctors", icon: Stethoscope, routePath: "doctors" },
  { id: "services", icon: Atom, routePath: "services" },
  { id: "nutrition", icon: Utensils, routePath: "foods" },
  { id: "articles", icon: BookOpen, routePath: "articles" },
] as const;

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

  const t = useTranslations("search");
  const tCommon = useTranslations("common");

  const tabs: TabConfig[] = TAB_IDS.map((tab) => ({
    id: tab.id,
    label: t(`tabs.${tab.id}.label`),
    icon: tab.icon,
    placeholder: t(`tabs.${tab.id}.placeholder`),
    routePath: tab.routePath,
  }));
  const strings = {
    tablistAria: t("tablistAria"),
    formAria: t("formAria"),
    searchButton: tCommon("search"),
    guarantee1: t("guarantee1"),
    guarantee2: t("guarantee2"),
    guarantee3: t("guarantee3"),
  };
  const isEn = locale === "en";

  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

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
    <div className={`w-full ${className}`} dir={isEn ? "ltr" : "rtl"}>
      {/* Search card container */}
      <div className="w-full bg-surface-container-lowest rounded-3xl shadow-tier-1 p-4 sm:p-6 border border-outline-variant/30 transition-shadow hover:shadow-tier-2">
        {/* Category Tabs */}
        <div
          role="tablist"
          aria-label={strings.tablistAria}
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none"
        >
          {tabs.map((tab) => {
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
                <tab.icon size={18} className="shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          aria-label={strings.formAria}
          className="flex flex-col md:flex-row items-center gap-3"
        >
          <div className="relative w-full flex items-center bg-surface-container-low rounded-2xl px-4 py-2 transition-colors focus-within:bg-surface-container focus-within:ring-2 focus-within:ring-primary/20">
            <Search
              size={24}
              className="text-primary me-2 shrink-0"
              aria-hidden="true"
            />
            <input
              id="main-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={currentTab.placeholder}
              aria-label={currentTab.placeholder}
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none py-1 pe-2 text-start"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-medium px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all h-12 cursor-pointer"
          >
            <span>{strings.searchButton}</span>
            {isEn ? (
              <ArrowRight size={20} className="shrink-0" aria-hidden="true" />
            ) : (
              <ArrowLeft size={20} className="shrink-0" aria-hidden="true" />
            )}
          </button>
        </form>
      </div>

      {/* Trust Guarantees Row */}
      {showGuarantees && (
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-4 text-on-surface-variant text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <CircleCheckBig size={18} className="text-primary shrink-0" aria-hidden="true" />
            <span>{strings.guarantee1}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BadgeCheck size={18} className="text-primary shrink-0" aria-hidden="true" />
            <span>{strings.guarantee2}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Headset size={18} className="text-primary shrink-0" aria-hidden="true" />
            <span>{strings.guarantee3}</span>
          </div>
        </div>
      )}
    </div>
  );
}
