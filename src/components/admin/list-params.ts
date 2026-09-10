export interface ListParams {
  q: string;
  page: number;
  tab: string;
}

export const PAGE_SIZE = 20;

const first = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

export function parseListParams(
  sp: Record<string, string | string[] | undefined>,
  opts: { tabs: readonly string[]; defaultTab: string },
): ListParams {
  const rawTab = first(sp.tab ?? sp.status);
  return {
    q: first(sp.q).trim().toLowerCase(),
    page: Math.max(1, Number.parseInt(first(sp.page), 10) || 1),
    tab: opts.tabs.includes(rawTab) ? rawTab : opts.defaultTab,
  };
}

export function paginate<T>(rows: T[], page: number, pageSize: number = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safe = Math.min(page, totalPages);
  return { items: rows.slice((safe - 1) * pageSize, safe * pageSize), totalPages, total: rows.length };
}
