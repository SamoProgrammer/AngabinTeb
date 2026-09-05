import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { searchAll } from "@/contexts/catalog/queries";
import { EmptyState, ErrorState } from "@/components/clinical/empty-state";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

function toPersianDigits(n: string | number): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)] ?? x);
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { locale } = await params;
  const { q, type } = await searchParams;
  const isEn = locale === "en";
  const dir = isEn ? "ltr" : "rtl";

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
  let fetchedResults: Awaited<ReturnType<typeof searchAll>> = [];
  let loadError = false;
  if (queryTerm) {
    try {
      fetchedResults = await searchAll(queryTerm, locale);
    } catch {
      loadError = true;
    }
  }

  const results = fetchedResults.filter((item) => {
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
    <main className="w-full min-h-screen bg-surface pb-20" dir={dir}>
      {/* Search Hero Header */}
      <section className="relative w-full bg-surface-container-low border-b border-outline-variant/20 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-on-surface tracking-tight">
              جستجوی یکپارچه سلامت و درمان
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant">
              پزشکان متخصص، خدمات پاراکلینیک، برنامه‌های تغذیه و آموزش‌های معتبر بالینی
            </p>
          </div>

          {/* Search Form */}
          <form
            action={`/${locale}/search`}
            method="GET"
            className="w-full bg-surface-container-lowest shadow-tier-1 rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-2 border border-outline-variant/30"
          >
            {type && <input type="hidden" name="type" value={type} />}
            <div className="relative flex-1 w-full flex items-center gap-2 px-3">
              <ClinicalIcon name="search" size={20} className="text-primary shrink-0" />
              <input
                name="q"
                defaultValue={queryTerm}
                placeholder={t("placeholder")}
                aria-label={t("placeholder")}
                className="w-full bg-transparent text-sm sm:text-base text-on-surface focus:outline-none placeholder:text-on-surface-variant/60 py-2"
              />
              {queryTerm && (
                <Link
                  href={`/${locale}/search${type ? `?type=${type}` : ""}`}
                  className="p-1 text-on-surface-variant hover:text-on-surface rounded-full transition-colors"
                  title="پاک کردن"
                >
                  <ClinicalIcon name="close" size={16} />
                </Link>
              )}
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-container text-on-primary font-medium text-sm sm:text-base px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t("submit")}</span>
              <ClinicalIcon name="arrow_back" size={16} />
            </button>
          </form>

          {/* Quick Category Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-xs sm:text-sm">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className={`px-4 py-1.5 rounded-full font-medium transition-colors ${
                  currentTab === cat.id
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container border border-outline-variant/30"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Grid: Sidebar Filters + Results Feed */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Clinical Filter Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-4 w-full">
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-tier-1 border border-outline-variant/30 flex flex-col gap-4 text-start">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClinicalIcon name="filter_list" size={20} className="text-primary" />
                  <h2 className="text-sm font-bold text-on-surface">فیلترهای بالینی</h2>
                </div>
                <Link
                  href={`/${locale}/search`}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  بازنشانی فیلترها
                </Link>
              </div>

              {/* Specialty Filter Links */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-on-surface">
                  حوزه تخصصی پزشک
                </span>
                <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
                  {[
                    { label: "غدد، درون‌ریز و متابولیسم", query: "غدد" },
                    { label: "تغذیه و رژیم‌درمانی بالینی", query: "تغذیه" },
                    { label: "فوق تخصص گوارش و کبد", query: "گوارش" },
                    { label: "قلب، عروق و پیشگیری بالینی", query: "قلب" },
                  ].map((spec) => (
                    <Link
                      key={spec.query}
                      href={`/${locale}/search?q=${encodeURIComponent(spec.query)}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                        queryTerm.includes(spec.query)
                          ? "border-primary bg-primary/5 text-primary font-bold"
                          : "border-outline-variant/20 bg-surface-container-low text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      <span>{spec.label}</span>
                      <ClinicalIcon name="chevron_left" size={16} className="text-on-surface-variant shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Reassurance Banner */}
            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 flex items-start gap-3 text-start shadow-tier-1">
              <ClinicalIcon name="verified_user" size={22} className="text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-on-surface-variant leading-relaxed">
                <span className="font-bold block mb-1 text-on-surface">اطمینان از نظارت بالینی</span>
                تمامی پزشکان و مراکز تشخیصی انگبین طب دارای شماره نظام پزشکی معتبر و استعلام‌شده از سازمان کل نظام پزشکی ایران هستند.
              </div>
            </div>
          </aside>

          {/* Results List */}
          <section className="lg:col-span-8 flex flex-col gap-4 w-full">
            {loadError ? (
              <ErrorState
                title="خطا در انجام جستجو"
                hint="لطفاً اتصال خود را بررسی کرده و دوباره تلاش نمایید."
              />
            ) : !queryTerm ? (
              <EmptyState
                title="عبارتی را برای جستجو وارد کنید"
                hint="نام پزشک، خدمت درمانی، آزمایش یا موضوع آموزشی را بنویسید."
              />
            ) : (
              <>
                {/* Results Count Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 rounded-2xl shadow-tier-1 border border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-on-surface">
                      {`نتایج جستجو برای «${queryTerm}»`}
                    </h3>
                    <span className="bg-primary/10 text-primary font-bold text-xs px-2.5 py-0.5 rounded-full">
                      {toPersianDigits(results.length)} مورد
                    </span>
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
                        <article className="bg-surface-container-lowest rounded-2xl p-5 shadow-tier-1 hover:shadow-tier-2 transition-all flex flex-col md:flex-row gap-5 items-start justify-between border border-outline-variant/30 text-start">
                          <div className="flex flex-col sm:flex-row gap-4 items-start flex-1">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
                              <ClinicalIcon
                                name={isDoctor ? "stethoscope" : isService ? "science" : "menu_book"}
                                size={26}
                              />
                            </div>

                            <div className="flex flex-col gap-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                    isDoctor
                                      ? "bg-primary/10 text-primary"
                                      : isService
                                      ? "bg-secondary/10 text-secondary"
                                      : "bg-surface-container text-on-surface-variant"
                                  }`}
                                >
                                  {isDoctor ? "پزشک متخصص" : isService ? "خدمت درمانی" : "مقاله سلامت"}
                                </span>
                              </div>

                              <Link
                                href={targetUrl}
                                className="text-base font-bold text-on-surface hover:text-primary transition-colors"
                              >
                                {r.title}
                              </Link>

                              <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                                {r.subtitle}
                              </p>

                              {isService && (
                                <div className="flex items-center gap-1.5 pt-1 text-xs text-primary font-medium">
                                  <ClinicalIcon name="payments" size={16} />
                                  <span>پرداخت حضوری در مطب</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end justify-between w-full md:w-40 shrink-0 gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-outline-variant/20">
                            {isDoctor || isService ? (
                              <div className="text-start sm:text-end w-full">
                                <span className="text-[11px] text-on-surface-variant block">تعرفه مصوب</span>
                                <span className="text-xs font-bold text-on-surface">
                                  پرداخت در محل
                                </span>
                              </div>
                            ) : null}

                            <Link
                              href={targetUrl}
                              className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium text-center transition-colors shadow-xs flex items-center justify-center gap-1"
                            >
                              <span>{isDoctor ? "مشاهده نوبت‌ها" : isService ? "رزرو نوبت" : "مطالعه"}</span>
                              <ClinicalIcon name="chevron_left" size={14} />
                            </Link>
                          </div>
                        </article>
                      </li>
                    );
                  })}

                  {results.length === 0 && (
                    <li className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/30 flex flex-col items-center">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center mb-3">
                        <ClinicalIcon name="search" size={28} />
                      </div>
                      <h4 className="text-base font-bold text-on-surface mb-1">
                        {t("empty")}
                      </h4>
                      <p className="text-xs text-on-surface-variant max-w-md mb-4 leading-relaxed">
                        موردی منطبق با جستجوی شما یافت نشد. می‌توانید با عبارات پیشنهادی زیر مجدداً جستجو کنید:
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {["کبد چرب", "دیابت", "InBody", "نوار قلب (ECG)", "رژیم بالینی"].map((sug) => (
                          <Link
                            key={sug}
                            href={`/${locale}/search?q=${encodeURIComponent(sug)}`}
                            className="text-xs bg-surface-container hover:bg-primary/10 hover:text-primary text-on-surface-variant px-3 py-1.5 rounded-full transition-colors font-medium"
                          >
                            {sug}
                          </Link>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}