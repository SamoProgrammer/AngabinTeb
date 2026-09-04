import Link from "next/link";
import { notFound } from "next/navigation";
import { getContent } from "@/contexts/content/queries";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits } from "@/components/catalog/doctor-card";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale);
  if (!content) notFound();

  const paragraphs = content.body.split("\n\n").filter(Boolean);
  const leadParagraph = paragraphs[0] ?? "";
  const remainingParagraphs = paragraphs.slice(1);

  const formattedDate = content.publishedAt
    ? new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(content.publishedAt))
    : "—";

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant mb-6">
          <Link href={`/${locale}/articles`} className="hover:text-primary transition-colors">
            مجله سلامت
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-medium line-clamp-1">{content.title}</span>
        </nav>

        {/* Article Main Title */}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight mb-6 max-w-4xl text-start">
          {content.title}
        </h1>

        {/* Verified Metadata Strip (Screen #42) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
              <ClinicalIcon name="person" size={26} />
            </div>
            <div className="flex flex-col text-start">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base text-on-surface">دکتر لیلا سادات</span>
                <span className="text-primary flex items-center" title="پزشک تایید شده بالینی">
                  <ClinicalIcon name="verified" size={18} fill />
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">فوق‌تخصص غدد، متابولیسم و تغذیه بالینی</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-on-surface-variant">
            <span className="inline-flex items-center gap-1 bg-surface-container px-3 py-1 rounded-full">
              <ClinicalIcon name="schedule" size={16} className="text-primary" />
              <span>{toPersianDigits(8)} دقیقه مطالعه</span>
            </span>
            <span className="hidden sm:inline-block">{formattedDate}</span>
          </div>
        </div>

        {/* Video Player or Embedded Audio Banner (Screen #42) */}
        {content.kind === "video" && content.videoUrl ? (
          <div className="w-full rounded-2xl overflow-hidden shadow-tier-2 mb-10 bg-inverse-surface">
            <video controls src={content.videoUrl} className="w-full aspect-video rounded-2xl" />
          </div>
        ) : (
          <div className="relative w-full rounded-2xl overflow-hidden mb-10 shadow-tier-1 bg-primary text-on-primary p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-2xl text-start">
                <div className="flex items-center gap-2 text-on-primary font-bold text-sm">
                  <ClinicalIcon name="podcasts" size={24} />
                  <span>نسخه صوتی مقاله (پادکست سلامت بالینی)</span>
                </div>
                <p className="text-xs sm:text-sm text-on-primary/90 leading-relaxed">
                  روایت صوتی این مقاله جهت مرور سریع توصیه‌های بالینی در حین رانندگی یا فعالیت روزانه آماده شنیدن است.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 bg-on-primary text-primary px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:bg-surface-container-lowest transition-all shrink-0 cursor-pointer"
              >
                <ClinicalIcon name="play_arrow" size={20} fill />
                <span>پخش نسخه صوتی</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid with Asymmetric Sticky Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar (Screen #42) */}
          <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24 order-2 lg:order-1">
            {/* Physician Author Card */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs text-start flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  <ClinicalIcon name="stethoscope" size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-on-surface">دکتر لیلا سادات</h3>
                  <p className="text-xs text-on-surface-variant">فوق‌تخصص غدد و متابولیسم</p>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                مشاوره تخصصی ویزیت بالینی، اصلاح متابولیسم و پایش شاخص‌های قند و چربی خون.
              </p>
              <Link
                href={`/${locale}/doctors`}
                className="w-full bg-primary hover:bg-primary-container text-on-primary py-2.5 px-4 rounded-xl text-center font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <ClinicalIcon name="calendar_today" size={18} />
                <span>دریافت نوبت ویزیت با پزشک</span>
              </Link>
            </div>

            {/* Table of Contents */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs text-start">
              <h4 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                <ClinicalIcon name="menu_book" size={18} className="text-primary" />
                <span>فهرست بخش‌های مقاله</span>
              </h4>
              <nav className="flex flex-col gap-2 text-xs sm:text-sm text-on-surface-variant">
                <a href="#section-lead" className="p-2 rounded-lg bg-surface-container-low text-primary font-semibold hover:text-primary transition-colors">
                  ۱. مقدمه و بار بالینی اختلال
                </a>
                <a href="#section-details" className="p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  ۲. یافته‌های پژوهشی و مکانیسم اثر
                </a>
                <a href="#section-pearl" className="p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  ۳. نکته کلیدی بالینی (Clinical Pearl)
                </a>
                <a href="#section-takeaways" className="p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  ۴. جمع‌بندی و راهنمای مراجعین
                </a>
              </nav>
            </div>

            {/* Quick Interaction Buttons */}
            <div className="bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30 shadow-xs flex items-center justify-around text-xs text-on-surface-variant font-medium">
              <button type="button" className="flex items-center gap-1 hover:text-primary transition-colors py-1 px-3 rounded-lg">
                <ClinicalIcon name="bookmark_border" size={18} />
                <span>ذخیره در پرونده</span>
              </button>
              <span className="opacity-30">|</span>
              <button type="button" className="flex items-center gap-1 hover:text-primary transition-colors py-1 px-3 rounded-lg">
                <ClinicalIcon name="share" size={18} />
                <span>اشتراک‌گذاری</span>
              </button>
            </div>
          </aside>

          {/* Editorial Long-form Body */}
          <main className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2 text-start">
            {/* Intro Lead */}
            {leadParagraph && (
              <div id="section-lead" className="bg-surface-container-low/70 border border-outline-variant/30 p-6 sm:p-8 rounded-2xl shadow-xs">
                <p className="text-base sm:text-lg text-on-surface font-medium leading-relaxed">
                  {leadParagraph}
                </p>
              </div>
            )}

            {/* Article Details Paragraphs */}
            <div id="section-details" className="space-y-5 text-sm sm:text-base text-on-surface leading-relaxed">
              {remainingParagraphs.map((p, idx) => (
                <p key={idx} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* Clinical Insight Callout Box (Screen #42) */}
            <div id="section-pearl" className="bg-primary/5 border border-primary/20 p-6 rounded-2xl shadow-xs flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                <ClinicalIcon name="health_and_safety" size={26} />
              </div>
              <div className="flex flex-col gap-1.5 text-start">
                <h4 className="text-sm sm:text-base font-bold text-primary">
                  نکته کلیدی بالینی (Clinical Pearl):
                </h4>
                <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                  کاهش تنها ۵ الی ۷ درصد از وزن کل بدن می‌تواند ترشح تری‌گلیسرید داخل بافت کبد را به میزان چشمگیری مهار کرده و حساسیت گیرنده‌های انسولینی را به محدوده نرمال بازگرداند؛ همواره تغییرات پلکانی بر رژیم‌های سخت و غیرپایدار ارجحیت دارند.
                </p>
              </div>
            </div>

            {/* Key Takeaways Card */}
            <div id="section-takeaways" className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/30 shadow-xs text-start">
              <h4 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
                <ClinicalIcon name="check_circle" size={20} className="text-primary" />
                <span>پیام‌های اساسی برای مراقبت در منزل</span>
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-on-surface-variant list-disc list-inside leading-relaxed">
                <li>پایش منظم دوره‌ای شاخص‌های قند و چربی خون با تجویز پزشک معالج.</li>
                <li>جایگزینی تدریجی کربوهیدرات‌های تصفیه‌شده با نان سنگک سبوس‌دار و غلات کامل.</li>
                <li>حداقل ۱۵۰ دقیقه فعالیت هوازی ملایم مانند پیاده‌روی روزانه بعد از صرف غذا.</li>
                <li>مشورت فوری با پزشک در صورت بروز هرگونه افت ناگهانی قند یا تغییرات پایدار متابولیک.</li>
              </ul>
            </div>
          </main>
        </div>
      </article>
    </div>
  );
}