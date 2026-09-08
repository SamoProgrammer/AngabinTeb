import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listContent, listTopics } from "@/contexts/content/queries";
import { VideoCard } from "@/components/clinical/media-cards";
import { VideoOff } from "lucide-react";

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

  const t = await getTranslations("videos");
  const dir = locale === "en" ? "ltr" : "rtl";

  const topics = await listTopics(locale);
  const selectedTopic = topics.find((topic) => topic.slug === topicSlug);

  const { rows } = await listContent("video", locale, selectedTopic?.id);

  return (
    <div dir={dir} className="w-full bg-surface min-h-screen py-8 sm:py-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header Hero */}
        <div className="flex flex-col gap-2 text-start max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Categories Bar */}
        <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-2xl p-2 sm:p-3 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link
              href={`/${locale}/knowledge/videos`}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                !topicSlug
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t("allVideos")}
            </Link>
            {topics.map((topic) => {
              const isActive = topic.slug === topicSlug;
              return (
                <Link
                  key={topic.id}
                  href={`/${locale}/knowledge/videos?topic=${topic.slug}`}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {topic.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Video Cards Grid */}
        <section aria-label={t("listAria")}>
          {rows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rows.map((video) => (
                <VideoCard
                  key={video.id}
                  video={{
                    id: video.id,
                    slug: video.slug,
                    title: video.title,
                    summary: video.body,
                    videoUrl: video.videoUrl,
                    ...(selectedTopic ? { category: selectedTopic.name } : {}),
                    href: `/${locale}/articles/${video.slug}`,
                  }}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <VideoOff size={48} className="text-outline" aria-hidden="true" />
              <p className="text-base font-bold text-on-surface">{t("emptyTitle")}</p>
              <p className="text-xs text-on-surface-variant">{t("emptyDesc")}</p>
              <Link
                href={`/${locale}/knowledge/videos`}
                className="mt-2 inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                {t("backBtn")}
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
