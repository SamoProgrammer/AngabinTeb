import { notFound } from "next/navigation";
import { getContent } from "@/contexts/content/queries";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const content = await getContent(slug, locale);
  if (!content) notFound();
  const paragraphs = content.body.split("\n\n");
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      {content.kind === "video" && content.videoUrl && (
        <video controls src={content.videoUrl} className="w-full rounded" />
      )}
      <h1 className="mt-6 text-3xl font-bold">{content.title}</h1>
      {content.publishedAt && (
        <p className="mt-2 text-sm text-gray-500">
          {new Intl.DateTimeFormat(locale).format(new Date(content.publishedAt))}
        </p>
      )}
      {content.kind === "faq" ? (
        <details className="mt-6 rounded border p-4">
          <summary className="cursor-pointer font-medium">{content.title}</summary>
          <div className="mt-2 space-y-2 text-gray-600">
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </details>
      ) : (
        <div className="mt-6 space-y-4 text-gray-700">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
    </main>
  );
}