import { notFound } from "next/navigation";
import { getCondition, listContent } from "@/contexts/content/queries";

export default async function ConditionPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const condition = await getCondition(slug, locale);
  if (!condition) notFound();
  const { rows } = await listContent("article", locale, undefined, condition.id);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">{condition.name}</h1>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {rows.map((c) => (
          <li key={c.id} className="rounded border p-4">
            <a href={`/articles/${c.slug}`} className="font-medium">{c.title}</a>
            <p className="mt-2 text-sm text-gray-500">
              {c.publishedAt ? new Intl.DateTimeFormat(locale).format(new Date(c.publishedAt)) : "—"}
            </p>
          </li>
        ))}
        {rows.length === 0 && <p className="col-span-full py-4 text-gray-500">No articles yet.</p>}
      </ul>
    </main>
  );
}