import { listTopics } from "@/contexts/content/queries";

export default async function KnowledgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const topics = await listTopics(locale);
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Health knowledge</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((t) => (
          <a key={t.id} href={`/topics/${t.slug}`} className="rounded border p-4 hover:border-emerald-500">
            <p className="font-semibold">{t.name}</p>
            <p className="text-sm text-gray-500">{t.count} items</p>
          </a>
        ))}
      </div>
    </main>
  );
}