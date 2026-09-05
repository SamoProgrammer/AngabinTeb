"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export function FaqClient({
  dbFaqs = [],
  locale = "fa",
}: {
  dbFaqs?: { id: string; title: string; body: string; category?: string }[];
  locale?: string;
}) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  // Live curated entries only — no hardcoded defaults.
  const allFaqs = useMemo<FaqItem[]>(
    () =>
      dbFaqs.map((df) => ({
        id: df.id,
        question: df.title,
        answer: df.body,
        category: df.category,
      })),
    [dbFaqs],
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const f of allFaqs) {
      if (f.category) cats.add(f.category);
    }
    return Array.from(cats);
  }, [allFaqs]);

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allFaqs, selectedCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div dir="rtl" className="w-full flex flex-col gap-6">
      {/* Search Bar (Screen #29) */}
      <div className="max-w-2xl mx-auto w-full relative shadow-xs rounded-2xl bg-surface-container-lowest p-2 border border-outline-variant/30">
        <div className="flex items-center gap-3 px-3 py-1.5">
          <ClinicalIcon name="search" size={22} className="text-primary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی پرسش، موضوع یا کلمه کلیدی..."
            className="w-full bg-transparent text-on-surface placeholder:text-outline text-sm sm:text-base focus:outline-none text-start"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-outline hover:text-on-surface px-2 py-1"
            >
              پاک کردن
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs (rendered when multiple categories exist) */}
      {categories.length > 0 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              selectedCategory === "all"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            همه موارد
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Accordion List (Screen #29) */}
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-3">
        {filteredFaqs.map((faq) => {
          const isOpen = Boolean(openIds[faq.id]);
          return (
            <div
              key={faq.id}
              className={`bg-surface-container-lowest rounded-2xl overflow-hidden border transition-all duration-200 ${
                isOpen
                  ? "border-primary/40 shadow-xs ring-1 ring-primary/20"
                  : "border-outline-variant/30 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(faq.id)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-start text-on-surface font-bold text-sm sm:text-base focus:outline-none cursor-pointer gap-4"
              >
                <span className="leading-snug">{faq.question}</span>
                <ClinicalIcon
                  name="expand_more"
                  size={22}
                  className={`text-outline transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-on-surface-variant text-xs sm:text-sm leading-relaxed border-t border-outline-variant/10 pt-4 text-start">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}

        {allFaqs.length === 0 && (
          <div className="bg-surface-container-low p-10 rounded-2xl text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <ClinicalIcon name="help" size={40} className="text-outline" />
            <p className="font-bold text-sm">هنوز پرسش متداولی ثبت نشده است.</p>
            <p className="text-xs">به‌زودی پاسخ پرسش‌های پرتکرار در این بخش منتشر می‌شود.</p>
          </div>
        )}

        {allFaqs.length > 0 && filteredFaqs.length === 0 && (
          <div className="bg-surface-container-low p-10 rounded-2xl text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
            <ClinicalIcon name="help" size={40} className="text-outline" />
            <p className="font-bold text-sm">پرسشی با این عبارت یافت نشد.</p>
            <p className="text-xs">می‌توانید کلمات جستجو را تغییر دهید یا با کارشناسان پشتیبانی تماس حاصل فرمایید.</p>
          </div>
        )}
      </div>

      {/* Support Helpline Banner (Screen #29) */}
      <div className="max-w-4xl mx-auto w-full mt-6 bg-surface-container-low rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center gap-3 border border-outline-variant/30">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <ClinicalIcon name="support_agent" size={28} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-on-surface">پرسش دیگری دارید؟</h3>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-md leading-relaxed">
          کارشناسان پشتیبانی مراجعین همه روزه آماده پاسخگویی و راهنمایی شما در زمینه نوبت‌دهی و مدارک پزشکی هستند.
        </p>
        <Link
          href={`/${locale}/support`}
          className="bg-primary text-on-primary text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-xs hover:bg-primary-container transition-all inline-flex items-center gap-2 mt-2"
        >
          <ClinicalIcon name="chat" size={18} />
          <span>ارتباط با پشتیبانی مراجعین</span>
        </Link>
      </div>
    </div>
  );
}
