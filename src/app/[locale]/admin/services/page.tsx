import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { services, providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toPersianDigits } from "@/lib/format";

const SERVICE_TYPES = ["diagnostic", "therapy", "home_care", "rehab", "ambulance", "consultation"] as const;

export default async function AdminServicesPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ serviceType?: string }>;
  params?: Promise<{ locale?: string }>;
}) {
  const { serviceType } = await searchParams;
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tServices = await getTranslations("admin.services");
  const tCommon = await getTranslations("admin.common");

  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      providerName: providers.name,
      serviceType: services.serviceType,
      basePrice: services.basePrice,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .where(serviceType && serviceType !== "all" ? and(eq(services.serviceType, serviceType)) : undefined)
    .orderBy(services.name);

  return (
    <div className="text-start">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tServices("title")}</h1>
        <Button nativeButton={false} render={<Link href={`${prefix}/admin/services/new`} />}>
          {tServices("newBtn")}
        </Button>
      </div>
      <form className="mb-4 flex items-center gap-2">
        <select
          name="serviceType"
          defaultValue={serviceType ?? "all"}
          className="rounded-md border border-outline-variant/50 bg-surface-container-low px-2.5 py-1 text-sm outline-none"
        >
          <option value="all">{tCommon("allTypes")}</option>
          {SERVICE_TYPES.map((typeKey) => (
            <option key={typeKey} value={typeKey}>
              {tServices(`types.${typeKey}` as any)}
            </option>
          ))}
        </select>
        <Button type="submit">{tCommon("filter")}</Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("provider")}</TableHead>
            <TableHead>{tCommon("type")}</TableHead>
            <TableHead>{tCommon("price")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((s) => {
            const isKnownType = SERVICE_TYPES.includes(s.serviceType as (typeof SERVICE_TYPES)[number]);
            const typeLabel = isKnownType
              ? tServices(`types.${s.serviceType}` as any)
              : s.serviceType;

            const formattedPrice =
              locale === "en"
                ? Number(s.basePrice).toLocaleString()
                : toPersianDigits(Number(s.basePrice).toLocaleString());

            return (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={`${prefix}/admin/services/${s.id}`} className="font-medium text-primary hover:underline">
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell>{s.providerName}</TableCell>
                <TableCell>{typeLabel}</TableCell>
                <TableCell>{formattedPrice}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}