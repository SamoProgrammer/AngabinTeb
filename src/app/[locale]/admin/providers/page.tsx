import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminProvidersPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tProviders = await getTranslations("admin.providers");
  const tCommon = await getTranslations("admin.common");

  const rows = await db.select().from(providers).orderBy(providers.name);

  return (
    <div className="text-start">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tProviders("title")}</h1>
        <Button nativeButton={false} render={<Link href={`${prefix}/admin/providers/new`} />}>
          {tProviders("newBtn")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("kind")}</TableHead>
            <TableHead>{tCommon("phone")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
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
    </div>
  );
}