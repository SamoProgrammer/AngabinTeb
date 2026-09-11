import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination, AdminEmpty } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminProvidersPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ q?: string; kind?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tProviders = await getTranslations("admin.providers");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");

  const sp = (await searchParams) ?? {};
  const { q, page } = parseListParams(sp, { tabs: [], defaultTab: "" });
  const kind = sp.kind === "person" || sp.kind === "organization" ? sp.kind : "all";

  const rows = await db.select().from(providers).orderBy(providers.name);

  // ponytail: in-page kind + text filter; move to a DB-level filter past ~200 providers.
  const filtered = rows.filter(
    (p) =>
      (kind === "all" || p.kind === kind) &&
      (q === "" ||
        p.name.toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q)),
  );
  const { items, totalPages } = paginate(filtered, page);

  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const allLabel = locale === "en" ? "All" : locale === "ar" ? "الكل" : "همه";
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tProviders("title") }]}
        title={tProviders("title")}
        action={
          <Button nativeButton={false} render={<Link href={`${prefix}/admin/providers/new`} />}>
            {tProviders("newBtn")}
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
            <option value="person">{tProviders("kindPerson")}</option>
            <option value="organization">{tProviders("kindOrg")}</option>
          </select>
        </AdminToolbar>
      </div>
      {items.length === 0 ? (
        <AdminEmpty
          title={tProviders("title")}
          actionHref={`${prefix}/admin/providers/new`}
          actionLabel={tProviders("newBtn")}
        />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("kind")}</TableHead>
            <TableHead>{tCommon("phone")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link href={`${prefix}/admin/providers/${p.id}`} className="font-medium text-primary hover:underline">
                  {p.name}
                </Link>
              </TableCell>
              <TableCell>
                {p.kind === "organization"
                  ? tProviders("kindOrg")
                  : tProviders("kindPerson")}
              </TableCell>
              <TableCell>{p.phone ?? tCommon("emptyValue")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}
      <div className="mt-4">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          hrefFor={(p) => `?kind=${kind}${qParam}&page=${p}`}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      </div>
    </div>
  );
}
