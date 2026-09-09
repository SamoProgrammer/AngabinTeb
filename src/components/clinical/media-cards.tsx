"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, BookOpen, CirclePlay, Play, Timer, User, Video } from "lucide-react";
import { toPersianDigits } from "@/lib/format";

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
    summary,
    authorName,
    readingTimeMinutes,
    category,
    imageUrl,
    href,
  } = article;

  const isEn = locale === "en";
  const tCommon = useTranslations("common");
  const targetHref = href ?? `/${locale}/articles/${slug || id}`;

  let displayReadingTime: string | null = null;
  if (readingTimeMinutes !== undefined && readingTimeMinutes !== null) {
    const localizedMinutes =
      locale === "fa" ? toPersianDigits(readingTimeMinutes) : String(readingTimeMinutes);
    displayReadingTime = tCommon("readingTime", { minutes: localizedMinutes });
  }

  return (
    <article
      dir={isEn ? "ltr" : "rtl"}
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
              <BookOpen size={48} className="opacity-40" aria-hidden="true" />
            </div>
          )}
          {category && (
            <span className="absolute top-3 end-3 bg-secondary text-on-secondary px-2.5 py-0.5 rounded-full text-xs font-medium shadow-xs">
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
          {summary && (
            <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-3">
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Footer Meta — rendered only for stored fields */}
      {(authorName || displayReadingTime) && (
        <div className="p-4 sm:p-5 pt-0 flex items-center justify-between text-on-surface-variant text-xs border-t border-outline-variant/10 mt-2">
          {authorName ? (
            <span className="flex items-center gap-1.5 font-medium">
              <User size={16} className="text-primary shrink-0" aria-hidden="true" />
              <span>{authorName}</span>
            </span>
          ) : (
            <span />
          )}
          {displayReadingTime && (
            <span className="flex items-center gap-1 text-on-surface-variant/80">
              <Timer size={16} className="shrink-0" aria-hidden="true" />
              <span>{displayReadingTime}</span>
            </span>
          )}
        </div>
      )}
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
    summary,
    speakerName,
    durationMinutes,
    durationLabel,
    thumbnailUrl,
    category,
    href,
  } = video;

  const isEn = locale === "en";
  const tCommon = useTranslations("common");
  // No /videos/[slug] route exists — video detail renders via the article reader.
  const targetHref = href ?? `/${locale}/articles/${slug || id}`;

  let displayDuration: string | null = durationLabel ?? null;
  if (!displayDuration && durationMinutes !== undefined && durationMinutes !== null) {
    const localizedMinutes =
      locale === "fa" ? toPersianDigits(durationMinutes) : String(durationMinutes);
    displayDuration = tCommon("videoDuration", { minutes: localizedMinutes });
  }

  const playAria = tCommon("playVideo", { title });

  const watchVideoText = tCommon("watchVideo");

  return (
    <div
      dir={isEn ? "ltr" : "rtl"}
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
              <CirclePlay size={56} className="text-primary/50" aria-hidden="true" />
            </div>
          )}

          {/* Centered Play Button Overlay */}
          <Link
            href={targetHref}
            aria-label={playAria}
            className="absolute inset-0 bg-inverse-surface/30 flex items-center justify-center group-hover:bg-inverse-surface/20 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play size={32} fill="currentColor" className="shrink-0 ms-0.5" aria-hidden="true" />
            </div>
          </Link>

          {/* Duration Chip on Thumbnail — stored duration only */}
          {displayDuration && (
            <span className="absolute bottom-2.5 start-2.5 bg-inverse-surface/85 text-inverse-on-surface px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs">
              <Video size={14} className="shrink-0" aria-hidden="true" />
              <span>{displayDuration}</span>
            </span>
          )}

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
          {summary && (
            <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed mb-3">
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* Footer Meta and Action — speaker shown only when stored */}
      <div className="p-4 sm:p-5 pt-0 flex items-center justify-between text-on-surface-variant text-xs border-t border-outline-variant/10 mt-2">
        {speakerName ? (
          <span className="flex items-center gap-1.5 font-medium">
            <User size={16} className="text-primary shrink-0" aria-hidden="true" />
            <span>{speakerName}</span>
          </span>
        ) : (
          <span />
        )}
        <Link
          href={targetHref}
          className="flex items-center gap-1 text-primary font-bold hover:underline cursor-pointer"
        >
          <span>{watchVideoText}</span>
          {isEn ? (
            <ArrowRight size={16} className="shrink-0" aria-hidden="true" />
          ) : (
            <ArrowLeft size={16} className="shrink-0" aria-hidden="true" />
          )}
        </Link>
      </div>
    </div>
  );
}
