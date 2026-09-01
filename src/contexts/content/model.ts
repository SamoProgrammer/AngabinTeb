export type ContentKind = "article" | "pamphlet" | "faq" | "video";

export type ContentCard = {
  id: string;
  slug: string;
  title: string;
  videoUrl: string | null;
  publishedAt: Date | null;
};

export type ContentDetail = {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  body: string;
  videoUrl: string | null;
  publishedAt: Date | null;
};

export type TopicCard = {
  id: string;
  slug: string;
  name: string;
  count: number;
};