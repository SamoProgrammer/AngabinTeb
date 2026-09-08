import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { dietPrograms } from "@/db/schema";
import { createDietProgram } from "@/contexts/nutrition/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";
import { DietProgramForm } from "./diet-program-form";

export default async function AdminDietProgramsPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";

  const tDiet = await getTranslations("admin.dietPrograms");
  const tCommon = await getTranslations("admin.common");

  const rows = await db.select().from(dietPrograms).orderBy(dietPrograms.name);

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tDiet("title")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tDiet("context")}</TableHead>
            <TableHead>{tDiet("planType")}</TableHead>
            <TableHead>{tDiet("durationDays")}</TableHead>
            <TableHead>{tCommon("price")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => {
            const formattedPrice =
              locale === "en"
                ? Number(p.price).toLocaleString()
                : toPersianDigits(Number(p.price).toLocaleString());

            const formattedDuration =
              locale === "en"
                ? `${p.durationDays} ${tDiet("durationUnit")}`
                : `${toPersianDigits(p.durationDays)} ${tDiet("durationUnit")}`;

            return (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.organizationContext}</TableCell>
                <TableCell>{p.planType}</TableCell>
                <TableCell>{formattedDuration}</TableCell>
                <TableCell>{formattedPrice}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <h2 className="mb-4 mt-8 text-lg font-semibold">{tDiet("newTitle")}</h2>
      <DietProgramForm action={createDietProgram} locale={locale} />
    </div>
  );
}