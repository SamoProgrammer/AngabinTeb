import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { serviceCategories } from "@/db/schema";
import { createCategory } from "@/contexts/catalog/actions";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormDrawer } from "@/components/admin/form-drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryForm } from "./category-form";

export default async function AdminCategoriesPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tCategories = await getTranslations("admin.categories");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");
  const tCancel = await getTranslations("common");

  const sp = (await searchParams) ?? {};
  const { q, page } = parseListParams(sp, { tabs: [], defaultTab: "" });

  const rows = await db.select().from(serviceCategories).orderBy(serviceCategories.name);

  // ponytail: in-page text filter; move to a DB-level filter past ~200 categories.
  const filtered = rows.filter(
    (c) =>
      q === "" ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q),
  );
  const { items, totalPages } = paginate(filtered, page);

  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tCategories("title") }]}
        title={tCategories("title")}
        action={
          <FormDrawer
            openLabel={tCategories("newBtn")}
            title={tCategories("newTitle")}
            closeLabel={tCancel("cancel")}
          >
            <CategoryForm action={createCategory} locale={locale} />
          </FormDrawer>
        }
      />
      <div className="mb-4">
        <AdminToolbar placeholder={tSearch("search")} searchLabel={tCommon("filter")} currentQ={q} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("slug")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Link href={`${prefix}/admin/categories/${c.id}`} className="font-medium text-primary hover:underline">
                  {c.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{c.slug}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
