import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination, AdminEmpty } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminFoodsPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tFoods = await getTranslations("admin.foods");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");

  const sp = (await searchParams) ?? {};
  const { q, page } = parseListParams(sp, { tabs: [], defaultTab: "" });

  const rows = await db.select().from(foods).orderBy(foods.name);

  // ponytail: in-page text filter; move to a DB-level filter past ~200 foods.
  const filtered = rows.filter(
    (f) =>
      q === "" ||
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q),
  );
  const { items, totalPages } = paginate(filtered, page);

  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tFoods("title") }]}
        title={tFoods("title")}
        action={
          <Button nativeButton={false} render={<Link href={`${prefix}/admin/foods/new`} />}>
            {tCommon("create")}
          </Button>
        }
      />
      <div className="mb-4">
        <AdminToolbar placeholder={tSearch("search")} searchLabel={tCommon("filter")} currentQ={q} />
      </div>
      {items.length === 0 ? (
        <AdminEmpty
          title={tFoods("title")}
          actionHref={`${prefix}/admin/foods/new`}
          actionLabel={tCommon("create")}
        />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("category")}</TableHead>
            <TableHead>{tFoods("source")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((f) => (
            <TableRow key={f.id}>
              <TableCell>
                <Link href={`${prefix}/admin/foods/${f.id}`} className="font-medium text-primary hover:underline">
                  {f.name}
                </Link>
              </TableCell>
              <TableCell>{f.category}</TableCell>
              <TableCell>{f.source}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      )}
      <div className="mt-4">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          hrefFor={(p) => `?page=${p}${qParam}`}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      </div>
    </div>
  );
}
