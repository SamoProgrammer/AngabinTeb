import { useTranslations } from "next-intl";
import { searchAll } from "@/contexts/catalog/queries";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const results = await searchAll(q ?? "", locale);
  const t = useTranslations("search");
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <form className="mb-8 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("placeholder")}
          className="flex-1 rounded border px-3 py-2"
          aria-label={t("placeholder")}
        />
        <button type="submit" className="rounded bg-emerald-600 px-6 py-2 text-white">{t("submit")}</button>
      </form>
      <ul className="divide-y">
        {results.map((r) => (
          <li key={`${r.type}-${r.id}`} className="py-4">
            <a href={r.href}>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-gray-600">{r.subtitle}</p>
            </a>
          </li>
        ))}
        {results.length === 0 && q && <li className="py-8 text-gray-500">{t("empty")}</li>}
      </ul>
    </main>
  );
}