import { notFound } from "next/navigation";
import { getTopicHub } from "@/contexts/content/queries";

export default async function TopicHubPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const hub = await getTopicHub(slug, locale);
  if (!hub) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">{hub.topic.name}</h1>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Articles</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {hub.content.map((c) => (
            <li key={c.id} className="rounded border p-4">
              <a href={`/articles/${c.slug}`} className="font-medium">{c.title}</a>
              <p className="mt-2 text-sm text-gray-500">
                {c.publishedAt ? new Intl.DateTimeFormat(locale).format(new Date(c.publishedAt)) : "—"}
              </p>
            </li>
          ))}
          {hub.content.length === 0 && <p className="col-span-full py-4 text-gray-500">No articles yet.</p>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Conditions</h2>
        <ul className="mt-4 space-y-2">
          {hub.conditions.map((c) => (
            <li key={c.id} className="rounded border p-4">
              <a href={`/conditions/${c.slug}`} className="font-medium">{c.name}</a>
            </li>
          ))}
          {hub.conditions.length === 0 && <p className="py-4 text-gray-500">No conditions yet.</p>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Related services</h2>
        <ul className="mt-4 space-y-2">
          {hub.relatedServices.map((s) => (
            <li key={s.id} className="rounded border p-4">
              <a href={s.href} className="font-medium">{s.title}</a>
              <p className="mt-1 text-sm text-gray-500">{s.subtitle}</p>
            </li>
          ))}
          {hub.relatedServices.length === 0 && <p className="py-4 text-gray-500">No related services yet.</p>}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Related doctors</h2>
        <ul className="mt-4 space-y-2">
          {hub.relatedDoctors.map((d) => (
            <li key={d.id} className="rounded border p-4">
              <a href={d.href} className="font-medium">{d.title}</a>
              <p className="mt-1 text-sm text-gray-500">{d.subtitle}</p>
            </li>
          ))}
          {hub.relatedDoctors.length === 0 && <p className="py-4 text-gray-500">No related doctors yet.</p>}
        </ul>
      </section>
    </main>
  );
}