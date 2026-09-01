import { db } from "@/db";
import { foods } from "@/db/schema";
import { searchFoods } from "@/contexts/nutrition/queries";

const pageSize = 20;

function pageHref(q: string, category: string, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  params.set("page", String(page));
  return `/foods?${params.toString()}`;
}

export default async function FoodsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { q, category, page } = await searchParams;
  const p = Number(page ?? 1);
  const current = Number.isFinite(p) ? Math.max(1, p) : 1;
  const categories = await db
    .select({ category: foods.category })
    .from(foods)
    .groupBy(foods.category)
    .orderBy(foods.category);
  const { rows, total } = await searchFoods(locale, q ?? "", category, current);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div>
      <h1 className="text-2xl font-bold">Food database</h1>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search foods…" className="flex-1 rounded border px-3 py-2" aria-label="Search foods" />
        <select name="category" defaultValue={category ?? ""} className="rounded border px-3 py-2">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </select>
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">Search</button>
      </form>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {rows.map((f) => (
          <li key={f.id} className="rounded border p-4">
            <a href={`/foods/${f.id}`} className="font-medium">{f.name}</a>
            <p className="text-sm text-gray-500">{f.category}</p>
          </li>
        ))}
        {rows.length === 0 && <li className="col-span-full py-4 text-gray-500">No foods found.</li>}
      </ul>
      <nav className="mt-8 flex gap-2">
        {current > 1 && <a href={pageHref(q ?? "", category ?? "", current - 1)}>Previous</a>}
        <span>Page {current} of {pages}</span>
        {current < pages && <a href={pageHref(q ?? "", category ?? "", current + 1)}>Next</a>}
      </nav>
    </div>
  );
}