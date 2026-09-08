import Link from "next/link";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { locations, providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminLocationsPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tLocations = await getTranslations("admin.locations");
  const tCommon = await getTranslations("admin.common");

  const rows = await db
    .select({ id: locations.id, label: locations.label, providerName: providers.name, cityId: locations.cityId, phone: locations.phone })
    .from(locations)
    .innerJoin(providers, eq(locations.providerId, providers.id))
    .orderBy(locations.label);

  return (
    <div className="text-start">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tLocations("title")}</h1>
        <Button nativeButton={false} render={<Link href={`${prefix}/admin/locations/new`} />}>
          {tLocations("newBtn")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tLocations("labelFa")}</TableHead>
            <TableHead>{tCommon("provider")}</TableHead>
            <TableHead>{tCommon("city")}</TableHead>
            <TableHead>{tCommon("phone")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <Link href={`${prefix}/admin/locations/${l.id}`} className="font-medium text-primary hover:underline">
                  {l.label}
                </Link>
              </TableCell>
              <TableCell>{l.providerName}</TableCell>
              <TableCell>{l.cityId}</TableCell>
              <TableCell>{l.phone ?? tCommon("emptyValue")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}