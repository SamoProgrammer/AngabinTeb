import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminFoodsPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tFoods = await getTranslations("admin.foods");
  const tCommon = await getTranslations("admin.common");

  const rows = await db.select().from(foods).orderBy(foods.name);

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tFoods("title")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("category")}</TableHead>
            <TableHead>{tFoods("source")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((f) => (
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
    </div>
  );
}