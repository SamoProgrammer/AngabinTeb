import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { serviceCategories } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminCategoriesPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tCategories = await getTranslations("admin.categories");
  const tCommon = await getTranslations("admin.common");

  const rows = await db.select().from(serviceCategories).orderBy(serviceCategories.name);

  return (
    <div className="text-start">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tCategories("title")}</h1>
        <Button nativeButton={false} render={<Link href={`${prefix}/admin/categories/new`} />}>
          {tCategories("newBtn")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("slug")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
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
    </div>
  );
}