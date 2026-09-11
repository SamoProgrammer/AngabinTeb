import { getTranslations } from "next-intl/server";
import { saveContent } from "@/contexts/content/actions";
import { listTopics } from "@/contexts/content/queries";
import { ContentForm } from "../content-form";

export default async function AdminContentNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tContent = await getTranslations("admin.content");
  const topics = await listTopics(locale);

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tContent("newTitle")}</h1>
      <ContentForm action={saveContent} topics={topics} locale={locale} />
    </div>
  );
}
