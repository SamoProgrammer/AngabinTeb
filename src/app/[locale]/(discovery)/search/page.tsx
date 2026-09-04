import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { searchAll } from "@/contexts/catalog/queries";
import type { SearchResult } from "@/contexts/catalog/model";

function toPersianDigits(n: string | number): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
}

const FALLBACK_RESULTS: SearchResult[] = [
  {
    type: "doctor",
    id: "doc-sample-1",
    title: "دکتر لیلا سادات هاشمی",
    subtitle: "فوق تخصص غدد درون‌ریز، متابولیسم و دیابت بالینی",
    href: "/doctors/leila-sadat",
  },
  {
    type: "service",
    id: "svc-sample-1",
    title: "پک کامل آزمایشگاهی پایش قند و آنزیم‌های کبد",
    subtitle: "۱۲ تست حیاتی تشخیصی با نمونه‌گیری در منزل و جواب‌دهی ۲۴ ساعته",
    href: "/services/liver-checkup",
  },
  {
    type: "service",
    id: "svc-sample-2",
    title: "نوار قلب (ECG) و پایش آریتمی قلبی",
    subtitle: "ثبت ۱۲ لیدی فعالیت الکتریکی قلب همراه با تفسیر متخصص قلب",
    href: "/services/ecg",
  },
  {
    type: "content",
    id: "cnt-sample-1",
    title: "راهنمای جامع تفسیر آزمایش قند، چربی خون و آنزیم‌های کبدی",
    subtitle: "تحلیل شاخص‌های بالینی، مقاومت به انسولین و پروتکل‌های پیشگیری",
    href: "/articles/lab-interpretation",
  },
];

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { locale } = await params;
  const { q, type } = await searchParams;

  let t = (key: string) => {
    const map: Record<string, string> = {
      placeholder: "جستجوی پزشک، بیماری، آزمایش یا رژیم درمانی...",
      submit: "جستجو",
      empty: "نتیجه‌ای یافت نشد",
    };
    return map[key] || key;
  };

  try {
    const intlT = await getTranslations("search");
    t = (k: string) => intlT(k as "placeholder" | "submit" | "empty");
  } catch {
    // fallback in environments without next-intl server context
  }

  const queryTerm = q?.trim() ?? "";
  const fetchedResults = queryTerm ? await searchAll(queryTerm, locale) : [];
  const rawResults = queryTerm ? fetchedResults : FALLBACK_RESULTS;

  const results = rawResults.filter((item) => {
    if (!type || type === "all") return true;
    if (type === "doctor") return item.type === "doctor" || item.type === "clinic";
    if (type === "service") return item.type === "service";
    if (type === "content") return item.type === "content";
    return true;
  });

  const categories = [
    { id: "all", label: "همه", href: `/${locale}/search${queryTerm ? `?q=${encodeURIComponent(queryTerm)}` : ""}` },
    { id: "doctor", label: "پزشکان", href: `/${locale}/search?type=doctor${queryTerm ? `&q=${encodeURIComponent(queryTerm)}` : ""}` },
    { id: "service", label: "خدمات درمانی", href: `/${locale}/search?type=service${queryTerm ? `&q=${encodeURIComponent(queryTerm)}` : ""}` },
    { id: "content", label: "مقالات و آموزش‌ها", href: `/${locale}/search?type=content${queryTerm ? `&q=${encodeURIComponent(queryTerm)}` : ""}` },
  ];

  const currentTab = type || "all";

  return (
    <main className="w-full min-h-screen bg-slate-50/50 pb-20">
      {/* Search Hero Header */}
      <section className="relative w-full bg-slate-100/70 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              جستجوی یکپارچه سلامت و درمان
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              پزشکان متخصص، خدمات پاراکلینیک، برنامه‌های تغذیه و آموزش‌های معتبر بالینی
            </p>
          </div>

          {/* Search Form */}
          <form
            action={`/${locale}/search`}
            method="GET"
            className="w-full bg-white shadow-lg shadow-slate-200/50 rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-2 border border-slate-200"
          >
            {type && <input type="hidden" name="type" value={type} />}
            <div className="relative flex-1 w-full flex items-center gap-2 px-3">
              <svg
                className="w-5 h-5 text-emerald-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                name="q"
                defaultValue={queryTerm}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="w-full bg-transparent text-sm sm:text-base text-slate-900 focus:outline-none placeholder:text-slate-400 py-2"
              />
              {queryTerm && (
                <Link
                  href={`/${locale}/search${type ? `?type=${type}` : ""}`}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                  title="پاک کردن"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              )}
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm sm:text-base px-8 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t("submit")}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m0 0l7 7m-7-7l7-7" />
              </svg>
            </button>
          </form>

          {/* Quick Category Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs sm:text-sm">
            <span className="text-slate-500 font-medium">دسته‌بندی:</span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
                  currentTab === cat.id
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Grid: Sidebar Filters + Results Feed */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Clinical Filter Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-6 w-full">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-6 text-start">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h2 className="text-base font-bold text-slate-900">فیلترهای بالینی</h2>
                </div>
                <Link
                  href={`/${locale}/search`}
                  className="text-xs text-amber-700 hover:underline font-medium"
                >
                  بازنشانی فیلترها
                </Link>
              </div>

              {/* Specialty Filter */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  حوزه تخصصی پزشک
                </span>
                <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                      <span className="text-slate-700 group-hover:text-emerald-700 transition-colors">غدد، درون‌ریز و متابولیسم</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">۵</span>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                      <span className="text-slate-700 group-hover:text-emerald-700 transition-colors">تغذیه و رژیم‌درمانی بالینی</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">۴</span>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                      <span className="text-slate-700 group-hover:text-emerald-700 transition-colors">فوق تخصص گوارش و کبد</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">۳</span>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                      <span className="text-slate-700 group-hover:text-emerald-700 transition-colors">قلب، عروق و پیشگیری بالینی</span>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">۲</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Delivery Mode */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  نحوه ارائه خدمت
                </span>
                <div className="flex flex-col gap-2 text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                    <span className="text-slate-800">ویزیت حضوری در مطب / کلینیک</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                    <span className="text-slate-800">خون‌گیری و آزمایش در منزل</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                    <span className="text-slate-800">مشاوره و پایش تخصصی</span>
                  </label>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Insurance Acceptance */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  پوشش بیمه‌ای طرف قرارداد
                </span>
                <div className="flex flex-col gap-2 text-xs sm:text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                    <span className="text-slate-700">بیمه تامین اجتماعی و سلامت</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                    <span className="text-slate-700">بیمه‌های تکمیلی معتبر کشور</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600" />
                    <span className="text-slate-700">صدور فاکتور رسمی بیمه تکمیلی</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Reassurance Banner */}
            <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-100/80 flex items-start gap-3 text-start">
              <svg className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold block mb-1">اطمینان از نظارت بالینی</span>
                تمامی پزشکان و مراکز تشخیصی انگبین طب دارای شماره نظام پزشکی معتبر و استعلام‌شده از سازمان کل نظام پزشکی ایران هستند.
              </div>
            </div>
          </aside>

          {/* Results List */}
          <section className="lg:col-span-8 flex flex-col gap-6 w-full">
            {/* Results Count Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {queryTerm ? `نتایج جستجو برای «${queryTerm}»` : "پیشنهادهای بالینی برگزیده"}
                </h3>
                <span className="bg-emerald-50 text-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  {toPersianDigits(results.length)} مورد
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>ترتیب:</span>
                <select className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option>بالاترین تطابق بالینی</option>
                  <option>نزدیک‌ترین نوبت آزاد</option>
                  <option>بیشترین رضایت مراجعان</option>
                </select>
              </div>
            </div>

            {/* Results Feed */}
            <ul className="flex flex-col gap-4 divide-y-0">
              {results.map((r) => {
                const targetUrl = r.href.startsWith("/") ? `/${locale}${r.href}` : `/${locale}/${r.href}`;
                const isDoctor = r.type === "doctor" || r.type === "clinic";
                const isService = r.type === "service";

                return (
                  <li key={`${r.type}-${r.id}`}>
                    <article className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start justify-between border border-slate-200/80 text-start">
                      <div className="flex flex-col sm:flex-row gap-4 items-start flex-1">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl border border-emerald-100 shrink-0">
                          {isDoctor ? "دکتر" : isService ? "خدمت" : "مقاله"}
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                isDoctor
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isService
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {isDoctor ? "پزشک متخصص" : isService ? "خدمت بالینی" : "مقاله و آموزش"}
                            </span>
                            {isDoctor && (
                              <span className="text-xs text-slate-500">
                                نظام پزشکی معتبر
                              </span>
                            )}
                          </div>

                          <Link
                            href={targetUrl}
                            className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                          >
                            {r.title}
                          </Link>

                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {r.subtitle}
                          </p>

                          <div className="flex items-center gap-3 flex-wrap pt-2 text-xs text-slate-500">
                            {isDoctor && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                تهران، کلینیک تخصصی
                              </span>
                            )}
                            {isService && (
                              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                پرداخت حضوری در مطب
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end justify-between w-full md:w-44 shrink-0 gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {isDoctor || isService ? (
                          <div className="text-start sm:text-end w-full">
                            <span className="text-[11px] text-slate-400 block">تعرفه مصوب</span>
                            <span className="text-sm font-bold text-slate-800">
                              پرداخت در محل
                            </span>
                          </div>
                        ) : null}

                        <Link
                          href={targetUrl}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-center transition-colors shadow-sm flex items-center justify-center gap-1"
                        >
                          <span>{isDoctor ? "رزرو نوبت" : isService ? "مشاهده و رزرو" : "مطالعه کامل"}</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}

              {results.length === 0 && (
                <li className="bg-white rounded-3xl p-10 text-center border border-slate-200 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {t("empty")}
                  </h4>
                  <p className="text-sm text-slate-500 max-w-md mb-6">
                    موردی منطبق با جستجوی شما یافت نشد. می‌توانید با انتخاب دسته‌بندی‌های دیگر یا عبارات پیشنهادی زیر مجدداً جستجو کنید:
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {["کبد چرب", "دیابت", "InBody", "نوار قلب (ECG)", "رژیم بالینی"].map((sug) => (
                      <Link
                        key={sug}
                        href={`/${locale}/search?q=${encodeURIComponent(sug)}`}
                        className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {sug}
                      </Link>
                    ))}
                  </div>
                </li>
              )}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}