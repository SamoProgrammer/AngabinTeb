import Link from "next/link";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { searchFoods } from "@/contexts/nutrition/queries";
import { toPersianDigits } from "@/lib/metabolism";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

const pageSize = 20;

function pageHref(locale: string, q: string, category: string, p: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  params.set("page", String(p));
  return `/${locale}/foods?${params.toString()}`;
}

export default async function FoodsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q = "", category = "", page } = await searchParams;
  const p = Number(page ?? 1);
  const current = Number.isFinite(p) ? Math.max(1, p) : 1;

  const categories = await db
    .select({ category: foods.category })
    .from(foods)
    .groupBy(foods.category)
    .orderBy(foods.category);

  const { rows, total } = await searchFoods(locale, q.trim(), category, current);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-8 text-right" dir="rtl">
      {/* 1. Top Search & Hero Section (Screen #36) */}
      <section
        aria-label="جستجوی پایگاه داده خوراک‌ها"
        className="bg-surface-container-low rounded-3xl p-6 sm:p-8 md:p-10 border border-outline-variant/30 flex flex-col gap-5"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            دایرکتوری خوراک‌ها و غذاهای اصیل ایرانی
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant mt-1.5 leading-relaxed">
            ارزش غذایی، کالری استاندارد و مشخصات بیوشیمیایی خوراک‌های اصیل بر اساس مقیاس‌های پذیرفته‌شده خانگی.
          </p>
        </div>

        {/* Search & Filter Form */}
        <form
          method="GET"
          className="bg-surface-container-lowest p-2 sm:p-3 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col md:flex-row items-center gap-2"
        >
          <div className="flex items-center gap-2 w-full px-3 py-2 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <ClinicalIcon name="search" size={22} className="text-primary" />
            <input
              name="q"
              defaultValue={q}
              aria-label="Search foods"
              placeholder="جستجوی غذا یا مواد اولیه (مانند: قورمه‌سبزی، برنج، نان سنگک)..."
              className="w-full bg-transparent text-on-surface placeholder:text-outline text-xs sm:text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              name="category"
              defaultValue={category}
              className="w-full md:w-48 bg-surface-container-low text-on-surface text-xs sm:text-sm font-semibold rounded-xl px-3 py-2.5 border border-outline-variant/20 focus:outline-none"
            >
              <option value="">همه دسته‌بندی‌ها</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <ClinicalIcon name="search" size={18} />
              <span>جستجو</span>
            </button>
          </div>
        </form>
      </section>

      {/* 2. Main Content Layout (Screen #36) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Right Sidebar: Household Serving Sizes Guide (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-5 sticky top-24">
          <div className="bg-surface-container-lowest p-6 rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClinicalIcon name="balance" size={24} className="text-secondary" />
                <h2 className="text-base sm:text-lg font-bold text-on-surface">
                  راهنمای مقیاس‌های بومی
                </h2>
              </div>
              <span className="bg-secondary/10 text-secondary text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                استاندارد بالینی
              </span>
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              در رژیم‌های درمانی انگبین طب، غذاها با مقیاس‌های آشنا و بدون نیاز به ترازوی دائم سنجیده می‌شوند:
            </p>

            <div className="flex flex-col gap-3">
              {/* Metric 1: Kafgir */}
              <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                  <ClinicalIcon name="flatware" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-on-surface">
                      یک کفگیر برنج یا خورش
                    </span>
                    <span className="text-xs font-bold text-primary">~ ۱۵۰-۱۸۰ گرم</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    معادل حدود ۶ تا ۷ قاشق غذاخوری سرپر برنج پخته یا خورش بدون آب اضافی
                  </span>
                </div>
              </div>

              {/* Metric 2: Kaf-e Dast */}
              <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <div className="w-10 h-10 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                  <ClinicalIcon name="pan_tool" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-on-surface">
                      یک کف دست نان سنتی
                    </span>
                    <span className="text-xs font-bold text-secondary">~ ۳۰ گرم (۸۰ کالری)</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    مساحت کف دست بدون احتساب انگشتان (نان سنگک، بربری، تافتون)
                  </span>
                </div>
              </div>

              {/* Metric 3: Piyaleh */}
              <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <div className="w-10 h-10 rounded-xl bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
                  <ClinicalIcon name="soup_kitchen" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-on-surface">
                      یک پیاله یا کاسه ماست
                    </span>
                    <span className="text-xs font-bold text-tertiary">~ ۱۵۰ تا ۱۸۰ سی‌سی</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    پیاله استاندارد ماست‌خوری ایرانی جهت ماست‌های سنتی، ترشیجات، یا سوپ
                  </span>
                </div>
              </div>

              {/* Metric 4: Ghashogh */}
              <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                  <ClinicalIcon name="restaurant" size={20} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-on-surface">
                      یک قاشق روغن یا عسل
                    </span>
                    <span className="text-xs font-bold text-on-surface-variant">~ ۵ گرم (۴۵ کالری)</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    مبنای سنجش چربی‌های افزوده، روغن کنجد، زیتون فرابکر یا عسل انگبین
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Tip Box */}
            <div className="p-3.5 bg-primary/5 rounded-2xl flex items-start gap-2.5 border border-primary/20">
              <ClinicalIcon name="tips_and_updates" size={20} className="text-primary shrink-0" />
              <p className="text-xs text-primary leading-relaxed">
                نکته بالینی: شاخص گلیسمی برنج آبکش‌شده به دلیل خروج سبوس بالاتر است؛ برای بیماران متابولیک، کته زعفرانی به همراه شوید یا سبزیجات توصیه می‌شود.
              </p>
            </div>
          </div>
        </aside>

        {/* Center / Left: Food Directory Grid (8 cols) */}
        <main className="lg:col-span-8 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">
              نتایج غذاها و خوراک‌های ایرانی
            </h2>
            <span className="text-xs text-on-surface-variant">
              نمایش {toPersianDigits(rows.length)} از {toPersianDigits(total)} قلم کالیبره‌شده
            </span>
          </div>

          {/* Cards Grid */}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rows.map((f) => (
              <li
                key={f.id}
                className="bg-surface-container-lowest rounded-3xl p-5 shadow-xs hover:shadow-md transition-all border border-outline-variant/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-surface-container text-on-surface-variant text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {f.category}
                    </span>
                    <ClinicalIcon name="flatware" size={18} className="text-primary/70" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-on-surface">
                    {f.name}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                  <Link
                    href={`/${locale}/foods/${f.id}`}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <ClinicalIcon name="info" size={16} />
                    <span>مشاهده ارزش غذایی و مقیاس‌ها</span>
                  </Link>
                </div>
              </li>
            ))}

            {rows.length === 0 && (
              <li className="col-span-full bg-surface-container-lowest rounded-3xl p-10 text-center border border-dashed border-outline-variant/40">
                <ClinicalIcon name="search_off" size={36} className="text-on-surface-variant/40 mb-2" />
                <p className="text-sm font-bold text-on-surface">
                  خوراکی با مشخصات درخواستی یافت نشد.
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  لطفاً عبارت جستجو را ویرایش نمایید یا دسته‌بندی «همه دسته‌بندی‌ها» را انتخاب فرمایید.
                </p>
              </li>
            )}
          </ul>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <nav
              aria-label="صفحات پایگاه داده خوراک‌ها"
              className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-between gap-2"
            >
              {current > 1 ? (
                <Link
                  href={pageHref(locale, q, category, current - 1)}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
                >
                  <ClinicalIcon name="chevron_right" size={16} />
                  <span>صفحه قبلی</span>
                </Link>
              ) : (
                <div />
              )}

              <span className="text-xs font-semibold text-on-surface-variant">
                صفحه {toPersianDigits(current)} از {toPersianDigits(totalPages)}
              </span>

              {current < totalPages ? (
                <Link
                  href={pageHref(locale, q, category, current + 1)}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-xs font-bold text-on-surface transition-colors flex items-center gap-1"
                >
                  <span>صفحه بعدی</span>
                  <ClinicalIcon name="chevron_left" size={16} />
                </Link>
              ) : (
                <div />
              )}
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}