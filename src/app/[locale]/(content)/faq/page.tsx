import { getContent, listContent } from "@/contexts/content/queries";
import type { ContentDetail } from "@/contexts/content/model";

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { rows } = await listContent("faq", locale);
  const faqs = (await Promise.all(rows.map((r) => getContent(r.slug, locale)))).filter(
    (f): f is ContentDetail => f !== null,
  );
  return (
    <div>
      <h1 className="text-2xl font-bold">Frequently asked questions</h1>
      <div className="mt-6 space-y-2">
        {faqs.map((f) => (
          <details key={f.id} className="rounded border p-4">
            <summary className="cursor-pointer font-medium">{f.title}</summary>
            <p className="mt-2 text-gray-600">{f.body}</p>
          </details>
        ))}
        {faqs.length === 0 && <p className="py-4 text-gray-500">No FAQs yet.</p>}
      </div>
    </div>
  );
}