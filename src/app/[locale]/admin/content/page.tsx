import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listContentAdmin } from "@/contexts/content/queries";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const KNOWN_KINDS = ["article", "pamphlet", "faq", "video"] as const;
const KNOWN_STATUSES = ["draft", "published"] as const;

export default async function AdminContentPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ q?: string; kind?: string; status?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tContent = await getTranslations("admin.content");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");

  const sp = (await searchParams) ?? {};
  const { q, page } = parseListParams(sp, { tabs: [], defaultTab: "" });
  const kind = typeof sp.kind === "string" && (KNOWN_KINDS as readonly string[]).includes(sp.kind) ? sp.kind : "all";
  const status = typeof sp.status === "string" && (KNOWN_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "all";

  const rows = await listContentAdmin();

  // ponytail: in-page kind/status + text filter; move to a DB-level filter past ~200 rows.
  const filtered = rows.filter(
    (c) =>
      (kind === "all" || c.kind === kind) &&
      (status === "all" || c.status === status) &&
      (q === "" ||
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)),
  );
  const { items, totalPages } = paginate(filtered, page);

  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const allLabel = locale === "en" ? "All" : locale === "ar" ? "الكل" : "همه";
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;
  const filterParams =
    `kind=${encodeURIComponent(kind)}&status=${encodeURIComponent(status)}${qParam}`;

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tContent("title") }]}
        title={tContent("title")}
        action={
          <Button nativeButton={false} render={<Link href={`${prefix}/admin/content/new`} />}>
            {tContent("newBtn")}
          </Button>
        }
      />
      <div className="mb-4">
        <AdminToolbar placeholder={tSearch("search")} searchLabel={tCommon("filter")} currentQ={q}>
          <select
            name="kind"
            defaultValue={kind}
            aria-label={tCommon("kind")}
            className="rounded-md border border-outline-variant/50 bg-surface-container-low px-2.5 py-1 text-sm outline-none"
          >
            <option value="all">{allLabel}</option>
            {KNOWN_KINDS.map((k) => (
              <option key={k} value={k}>
                {tContent(`kinds.${k}` as any)}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status}
            aria-label={tCommon("status")}
            className="rounded-md border border-outline-variant/50 bg-surface-container-low px-2.5 py-1 text-sm outline-none"
          >
            <option value="all">{allLabel}</option>
            {KNOWN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {tContent(`statuses.${s}` as any)}
              </option>
            ))}
          </select>
        </AdminToolbar>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tContent("titleFa")}</TableHead>
            <TableHead>{tCommon("kind")}</TableHead>
            <TableHead>{tCommon("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => {
            const isKnownKind = KNOWN_KINDS.includes(c.kind as (typeof KNOWN_KINDS)[number]);
            const kindLabel = isKnownKind
              ? tContent(`kinds.${c.kind}` as any)
              : c.kind;

            const isKnownStatus = KNOWN_STATUSES.includes(c.status as (typeof KNOWN_STATUSES)[number]);
            const statusLabel = isKnownStatus
              ? tContent(`statuses.${c.status}` as any)
              : c.status;

            return (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`${prefix}/admin/content/${c.id}`} className="font-medium text-primary hover:underline">
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell>{kindLabel}</TableCell>
                <TableCell>{statusLabel}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="mt-4">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          hrefFor={(p) => `?${filterParams}&page=${p}`}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      </div>
    </div>
  );
}
