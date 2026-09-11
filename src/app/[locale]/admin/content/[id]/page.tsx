import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { contents, contentTopics, translations } from "@/db/schema";
import { saveContent } from "@/contexts/content/actions";
import { listTopics } from "@/contexts/content/queries";
import { ContentForm } from "../content-form";

export default async function AdminContentEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const tContent = await getTranslations("admin.content");
  const topics = await listTopics(locale);

  const [content] = await db.select().from(contents).where(eq(contents.id, id));
  if (!content) notFound();
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "content"), eq(translations.entityId, id)));
  const contentTopicRows = await db.select().from(contentTopics).where(eq(contentTopics.contentId, id));

  const initial: Record<string, string> = {
    id: content.id,
    kind: content.kind,
    slug: content.slug,
    titleFa: content.title,
    bodyFa: content.body,
    videoUrl: content.videoUrl ?? "",
    status: content.status,
  };
  for (const o of overrides) {
    if (o.locale !== "en" && o.locale !== "ar") continue;
    initial[`${o.field}${o.locale === "en" ? "En" : "Ar"}`] = o.value;
  }

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tContent("editTitle")}</h1>
      <ContentForm
        action={saveContent}
        initial={initial}
        topics={topics}
        currentTopicIds={contentTopicRows.map((tItem) => tItem.topicId)}
        locale={locale}
      />
    </div>
  );
}