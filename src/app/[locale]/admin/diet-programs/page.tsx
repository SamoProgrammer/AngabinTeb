import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { dietPrograms } from "@/db/schema";
import { createDietProgram } from "@/contexts/nutrition/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";
import { DietProgramForm } from "./diet-program-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PendingLink } from "@/components/clinical/pending-link";

export default async function AdminDietProgramsPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tDiet = await getTranslations("admin.dietPrograms");
  const tCommon = await getTranslations("admin.common");
  const tNav = await getTranslations("admin.nav");
  const ts = await getTranslations("states");

  const queueLabel =
    locale === "en"
      ? "View claim queue"
      : locale === "ar"
        ? "عرض قائمة الطلبات"
        : "مشاهده صف درخواست‌ها";

  const rows = await db.select().from(dietPrograms).orderBy(dietPrograms.name);

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tDiet("title") }]}
        title={tDiet("title")}
        action={
          <PendingLink
            href={`${prefix}/admin/diet-programs/claims?status=needs_review`}
            busyLabel={ts("loading")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary transition-colors hover:bg-primary-container sm:text-sm"
          >
            {queueLabel}
          </PendingLink>
        }
      />
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