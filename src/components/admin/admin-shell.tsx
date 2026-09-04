import type { ReactNode } from "react";
import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { LocaleSwitcher } from "@/components/locale-switcher";

export interface AdminShellProps {
  children: ReactNode;
  activePath?: string;
  locale?: string;
}

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "داشبورد عملیات", icon: "dashboard" },
  { href: "/admin/providers", label: "پزشکان و ارائه‌دهندگان", icon: "stethoscope" },
  { href: "/admin/services", label: "خدمات و آزمایش‌ها", icon: "medical_services" },
  { href: "/admin/categories", label: "دسته‌بندی خدمات", icon: "category" },
  { href: "/admin/locations", label: "مراکز و کلینیک‌ها", icon: "location_on" },
  { href: "/admin/scheduling", label: "زمان‌بندی و اسلات‌ها", icon: "calendar_month" },
  { href: "/admin/foods", label: "بانک خوراک‌های ایرانی", icon: "restaurant" },
  { href: "/admin/diet-programs", label: "برنامه‌های تغذیه", icon: "menu_book" },
  { href: "/admin/content", label: "مدیریت مقالات و مدیا", icon: "article" },
  { href: "/admin/topics", label: "مراکز سلامت ۳۶۰°", icon: "hub" },
  { href: "/admin/support", label: "پشتیبانی و تیکت‌ها", icon: "support_agent" },
  { href: "/admin/settings", label: "تنظیمات سامانه", icon: "settings" },
] as const;

export function AdminShell({ children, activePath = "/admin" }: AdminShellProps) {
  return (
    <div dir="rtl" className="flex min-h-screen bg-surface">
      {/* Admin Clinical Sidebar */}
      <aside className="w-64 bg-surface-container-lowest border-e border-outline-variant/30 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Admin Header Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-outline-variant/20">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
                <ClinicalIcon name="spa" size={18} />
              </div>
              <div className="flex flex-col text-start">
                <span className="font-extrabold text-sm text-primary">کنسول مدیریت بالینی</span>
                <span className="text-[10px] text-on-surface-variant">انگبین طب</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 flex flex-col gap-1 text-start overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = activePath === item.href || (item.href !== "/admin" && activePath.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs font-bold"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <ClinicalIcon name={item.icon} size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-outline-variant/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors"
            >
              <ClinicalIcon name="arrow_forward" size={16} />
              <span>مشاهده پورتال اصلی</span>
            </Link>
          </div>
          <div className="pt-2 border-t border-outline-variant/10 flex items-center justify-between">
            <LocaleSwitcher />
            <span className="text-[10px] text-outline">نسخه بالینی ۱.۰</span>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/20 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
              مدیر ارشد سامانه
            </span>
            <span className="text-xs text-on-surface-variant hidden sm:inline">
              دسترسی نظارتی و بالینی کامل
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
              <ClinicalIcon name="person" size={18} />
            </div>
            <span className="text-xs font-bold text-on-surface">پنل مدیر</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto text-start">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
