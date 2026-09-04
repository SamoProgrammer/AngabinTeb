import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { toPersianDigits } from "@/components/catalog/doctor-card";

export interface ArticleData {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  body?: string;
  authorName?: string;
  readingTimeMinutes?: number | string;
  publishedAt?: Date | string | null;
  category?: string;
  imageUrl?: string | null;
  href?: string;
}

export interface ArticleCardProps {
  article: ArticleData;
  locale?: string;
  className?: string;
}

export function ArticleCard({
  article,
  locale = "fa",
  className = "",
}: ArticleCardProps) {
  const {
    id,
    slug,
    title,
    summary = article.body ?? "بررسی علمی و بالینی تازه‌ترین یافته‌های پزشکی و تغذیه سلامت.",
    authorName = "دکتر آرش رادمنش",
    readingTimeMinutes = 5,
    category = "مقاله سلامت",
    imageUrl,
    href,
  } = article;

  const targetHref = href ?? `/${locale}/articles/${slug || id}`;
  const displayReadingTime = `${toPersianDigits(readingTimeMinutes)} دقیقه مطالعه`;

  return (
    <article
      dir="rtl"
      className={`group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 flex flex-col justify-between text-start border border-outline-variant/30 ${className}`}
    >
      <div>
        {/* Article Thumbnail */}
        <div className="relative h-48 w-full overflow-hidden bg-surface-container">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
              <ClinicalIcon name="menu_book" size={48} className="opacity-40" />
            </div>
          )}
          {category && (
            <span className="absolute top-3 right-3 bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full text-xs font-medium shadow-xs">
              {category}
            </span>
          )}
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5">
          <Link href={targetHref}>
            <h3 className="text-base font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-3">
            {summary}
          </p>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between text-on-surface-variant text-xs border-t border-outline-variant/10 mt-2">
        <span className="flex items-center gap-1.5 font-medium">
          <ClinicalIcon name="person" size={16} className="text-primary shrink-0" />
          <span>{authorName}</span>
        </span>
        <span className="flex items-center gap-1 text-on-surface-variant/80">
          <ClinicalIcon name="timer" size={16} className="shrink-0" />
          <span>{displayReadingTime}</span>
        </span>
      </div>
    </article>
  );
}

export interface VideoData {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  speakerName?: string;
  durationMinutes?: number | string;
  durationLabel?: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  category?: string;
  href?: string;
}

export interface VideoCardProps {
  video: VideoData;
  locale?: string;
  className?: string;
}

export function VideoCard({
  video,
  locale = "fa",
  className = "",
}: VideoCardProps) {
  const {
    id,
    slug,
    title,
    summary = "مصاحبه تصویری پیرامون نکات بالینی و راهکارهای ارتقای سلامت.",
    speakerName = "دکتر لیلا سادات",
    durationMinutes = 12,
    durationLabel,
    thumbnailUrl,
    category = "ویدیو پزشکی",
    href,
  } = video;

  const targetHref = href ?? `/${locale}/videos/${slug || id}`;
  const displayDuration = durationLabel ?? `${toPersianDigits(durationMinutes)} دقیقه`;

  return (
    <div
      dir="rtl"
      className={`group bg-surface-container-lowest rounded-2xl overflow-hidden shadow-tier-1 hover:shadow-tier-2 transition-all duration-300 flex flex-col justify-between text-start border border-outline-variant/30 ${className}`}
    >
      <div>
        {/* Video Thumbnail with Play Overlay */}
        <div className="relative h-48 w-full overflow-hidden bg-inverse-surface flex items-center justify-center">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-primary/20 flex items-center justify-center">
              <ClinicalIcon name="play_circle" size={56} className="text-primary/50" />
            </div>
          )}

          {/* Centered Play Button Overlay */}
          <Link
            href={targetHref}
            aria-label={`پخش ویدیو ${title}`}
            className="absolute inset-0 bg-inverse-surface/30 flex items-center justify-center group-hover:bg-inverse-surface/20 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <ClinicalIcon name="play_arrow" size={32} fill className="shrink-0 ms-0.5" />
            </div>
          </Link>

          {/* Duration Chip on Thumbnail */}
          <span className="absolute bottom-2.5 start-2.5 bg-inverse-surface/85 text-inverse-on-surface px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs">
            <ClinicalIcon name="videocam" size={14} className="shrink-0" />
            <span>{displayDuration}</span>
          </span>

          {/* Category Chip */}
          {category && (
            <span className="absolute top-2.5 end-2.5 bg-primary text-on-primary px-2.5 py-0.5 rounded-full text-xs font-medium shadow-xs">
              {category}
            </span>
          )}
        </div>

        {/* Video Content Details */}
        <div className="p-4 sm:p-5">
          <Link href={targetHref}>
            <h3 className="text-base font-bold text-on-surface mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </Link>
          <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-3">
            {summary}
          </p>
        </div>
      </div>

      {/* Footer Meta and Action */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between text-on-surface-variant text-xs border-t border-outline-variant/10 mt-2">
        <span className="flex items-center gap-1.5 font-medium">
          <ClinicalIcon name="person" size={16} className="text-primary shrink-0" />
          <span>{speakerName}</span>
        </span>
        <Link
          href={targetHref}
          className="flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer"
        >
          <span>تماشای ویدیو</span>
          <ClinicalIcon name="arrow_back" size={16} className="shrink-0" />
        </Link>
      </div>
    </div>
  );
}
