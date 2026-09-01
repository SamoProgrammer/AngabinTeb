import { listContent } from "@/contexts/content/queries";

const pageSize = 20;

function pageHref(page: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  return `/articles?${params.toString()}`;
}

export default async function ArticlesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  const p = Number(page ?? 1);
  const current = Number.isFinite(p) ? Math.max(1, p) : 1;
  const { rows, total } = await listContent("article", locale, undefined, undefined, current);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div>
      <h1 className="text-2xl font-bold">Articles</h1>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {rows.map((c) => (
          <li key={c.id} className="rounded border p-4">
            <a href={`/articles/${c.slug}`} className="font-medium">{c.title}</a>
            <p className="text-sm text-gray-500">
              {c.publishedAt ? new Intl.DateTimeFormat(locale).format(new Date(c.publishedAt)) : "—"}
            </p>
          </li>
        ))}
        {rows.length === 0 && <li className="col-span-full py-4 text-gray-500">No articles yet.</li>}
      </ul>
      <nav className="mt-8 flex gap-2">
        {current > 1 && <a href={pageHref(current - 1)}>Previous</a>}
        <span>Page {current} of {pages}</span>
        {current < pages && <a href={pageHref(current + 1)}>Next</a>}
      </nav>
    </div>
  );
}