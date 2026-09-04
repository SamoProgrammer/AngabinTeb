"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export interface FaqItem {
  id: string;
  category: "booking" | "insurance" | "nutrition" | "privacy";
  question: string;
  answer: string;
  icon: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "booking-free",
    category: "booking",
    icon: "event_available",
    question: "آیا برای رزرو آنلاین نوبت هزینه‌ای دریافت می‌شود؟",
    answer:
      "خیر، رزرو نوبت در انگبین طب کاملاً رایگان است. تمامی مبالغ مربوط به ویزیت یا خدمات درمانی صرفاً در زمان مراجعه و در مطب یا مرکز پزشکی با دستگاه کارت‌خوان پرداخت می‌شود.",
  },
  {
    id: "booking-cancel",
    category: "booking",
    icon: "cancel",
    question: "چگونه می‌توانم نوبت خود را تغییر دهم یا لغو کنم؟",
    answer:
      "به سادگی از طریق بخش «پرونده من» یا لینک ارسال‌شده در پیامک نوبت، می‌توانید تا ۳ ساعت پیش از ساعت ویزیت، نوبت خود را بدون هیچ هزینه‌ای جابه‌جا یا لغو نمایید.",
  },
  {
    id: "insurance-coverage",
    category: "insurance",
    icon: "receipt",
    question: "آیا خدمات انگبین طب تحت پوشش بیمه‌های پایه و تکمیلی قرار دارد؟",
    answer:
      "بله، تمامی پزشکان و مراکز عضو، نسخه الکترونیک بیمه سلامت و تامین اجتماعی صادر می‌کنند. همچنین فاکتور رسمی و ممهور جهت ارائه به کلیه شرکت‌های بیمه تکمیلی به شما تقدیم می‌گردد.",
  },
  {
    id: "payment-pos",
    category: "insurance",
    icon: "credit_card",
    question: "نحوه پرداخت هزینه‌ها چگونه است؟",
    answer:
      "هزینه ویزیت و خدمات بر اساس تعرفه رسمی مصوب، در زمان حضور در مطب و توسط دستگاه کارت‌خوان پذیرش می‌شود. هیچ‌گونه درگاه یا هزینه رزرو اینترنتی از مراجع دریافت نمی‌گردد.",
  },
  {
    id: "nutrition-diet",
    category: "nutrition",
    icon: "restaurant",
    question: "برنامه‌های تغذیه و رژیم چگونه تنظیم و پیگیری می‌شوند؟",
    answer:
      "برنامه‌های تغذیه توسط متخصصین بالینی بر اساس سبک زندگی، ذائقه سفره ایرانی و پارامترهای بیومتریک شما تنظیم می‌شود و در بخش «پرونده من» قابل پایش است.",
  },
  {
    id: "nutrition-scale",
    category: "nutrition",
    icon: "calculate",
    question: "آیا برای ثبت وعده‌های غذایی نیاز به ترازوی دیجیتال دارم؟",
    answer:
      "خیر، شما می‌توانید به راحتی با مقیاس‌های کاربردی و آشنای سفره ایرانی (مانند کفگیر، پیاله، قاشق و کف دست) مصرف روزانه خود را ثبت کنید و سامانه کالری و درشت‌مغذی‌ها را محاسبه می‌کند.",
  },
  {
    id: "privacy-data",
    category: "privacy",
    icon: "lock_person",
    question: "اطلاعات پرونده و آزمایش‌های من نزد چه کسانی محفوظ است؟",
    answer:
      "تمامی داده‌های بالینی شما با استانداردهای امنیتی رمزنگاری شده و منحصراً با رضایت مستقیم شما در اختیار پزشک معالج قرار می‌گیرد.",
  },
  {
    id: "privacy-export",
    category: "privacy",
    icon: "download",
    question: "آیا می‌توانم خلاصه‌ای از سوابق سلامت خود را دریافت کنم؟",
    answer:
      "بله، در هر زمان می‌توانید خلاصه جامع و مرتبی از نوبت‌ها، توصیه‌های تغذیه و سوابق ثبت‌شده خود را با فرمت استاندارد دریافت و ذخیره کنید.",
  },
];

const CATEGORIES = [
  { id: "all", label: "همه سوالات", icon: "apps" },
  { id: "booking", label: "نوبت‌دهی و لغو نوبت", icon: "event_available" },
  { id: "insurance", label: "بیمه‌ها و پرداخت", icon: "payments" },
  { id: "nutrition", label: "خدمات تغذیه و رژیم", icon: "restaurant" },
  { id: "privacy", label: "حریم خصوصی پرونده", icon: "lock" },
] as const;

export function FaqClient({
  dbFaqs = [],
  locale = "fa",
}: {
  dbFaqs?: { id: string; title: string; body: string }[];
  locale?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({ "booking-free": true });

  // Merge DB FAQs with rich default FAQs
  const allFaqs = useMemo(() => {
    const combined: FaqItem[] = [...DEFAULT_FAQS];
    for (const df of dbFaqs) {
      if (!combined.some((item) => item.question === df.title)) {
        combined.push({
          id: df.id,
          category: "booking",
          icon: "help",
          question: df.title,
          answer: df.body,
        });
      }
    }
    return combined;
  }, [dbFaqs]);

  const filteredFaqs = useMemo(() => {
    return allFaqs.filter((item) => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch =
        !searchQuery.trim() ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allFaqs, selectedCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div dir="rtl" className="w-full flex flex-col gap-8">
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
              className="text-xs text-outline hover:text-on-surface"
            >
              پاک کردن
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Screen #29) */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <ClinicalIcon name={cat.icon} size={18} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

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
                className="w-full flex items-center justify-between p-4 sm:p-5 text-start text-on-surface font-bold text-sm sm:text-base focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ClinicalIcon name={faq.icon} size={22} />
                  </span>
                  <span>{faq.question}</span>
                </div>
                <ClinicalIcon
                  name="expand_more"
                  size={22}
                  className={`text-outline transition-transform duration-300 shrink-0 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-on-surface-variant text-xs sm:text-sm leading-relaxed border-t border-outline-variant/10 pt-3 text-start">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredFaqs.length === 0 && (
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
