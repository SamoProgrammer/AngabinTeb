import Link from "next/link";
import { listContent, listTopics } from "@/contexts/content/queries";
import { VideoCard } from "@/components/clinical/media-cards";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

export default async function VideosPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ topic?: string }>;
}) {
  const { locale } = await params;
  const search = searchParams ? await searchParams : {};
  const topicSlug = search.topic;

  const topics = await listTopics(locale);
  const selectedTopic = topics.find((t) => t.slug === topicSlug);

  const { rows } = await listContent("video", locale, selectedTopic?.id);

  return (
    <div dir="rtl" className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Hero */}
        <div className="flex flex-col gap-3 text-start max-w-3xl">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs sm:text-sm bg-primary/10 px-3 py-1.5 rounded-full self-start">
            <ClinicalIcon name="videocam" size={18} />
            <span>آموزش تصویری سلامت و نکات بالینی</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            ویدیوها و وبینارهای تخصصی پزشکی
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            مشاهده مصاحبه‌های بالینی، آموزش‌های خودمراقبتی و وبینارهای تخصصی با کلام رسای پزشکان فوق‌تخصص انگبین طب.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-2xl p-2 sm:p-3 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link
              href="/videos"
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                !topicSlug
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              همه ویدیوها
            </Link>
            {topics.map((t) => {
              const isActive = t.slug === topicSlug;
              return (
                <Link
                  key={t.id}
                  href={`/videos?topic=${t.slug}`}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {t.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Video Cards Grid (Screen #47) */}
        <section aria-label="فهرست ویدیوهای سلامت">
          {rows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((video, idx) => (
                <VideoCard
                  key={video.id}
                  video={{
                    id: video.id,
                    slug: video.slug,
                    title: video.title,
                    summary: "توضیحات بالینی و راهنمای خودمراقبتی توسط متخصصین مرکز.",
                    videoUrl: video.videoUrl,
                    speakerName: idx % 2 === 0 ? "دکتر لیلا سادات" : "دکتر احسان آریا",
                    durationMinutes: 8 + (idx % 7),
                    category: selectedTopic?.name ?? "ویدیو بالینی",
                    href: `/articles/${video.slug}`,
                  }}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <ClinicalIcon name="videocam_off" size={48} className="text-outline" />
              <p className="text-base font-bold text-on-surface">ویدیویی در این دسته‌بندی یافت نشد</p>
              <p className="text-xs text-on-surface-variant">به زودی ویدیوهای آموزشی جدید این بخش بارگذاری خواهند شد.</p>
              <Link
                href="/videos"
                className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                بازگشت به همه ویدیوها
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}