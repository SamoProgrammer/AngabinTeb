import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { services, providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination, AdminEmpty } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { toPersianDigits } from "@/lib/format";

const SERVICE_TYPES = ["diagnostic", "therapy", "home_care", "rehab", "ambulance", "consultation"] as const;

export default async function AdminServicesPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ q?: string; serviceType?: string; provider?: string; page?: string }>;
  params?: Promise<{ locale?: string }>;
}) {
  const sp = await searchParams;
  const { q, page } = parseListParams(sp, { tabs: [], defaultTab: "" });
  const serviceType = typeof sp.serviceType === "string" ? sp.serviceType : "all";
  const provider = typeof sp.provider === "string" ? sp.provider : "all";
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tServices = await getTranslations("admin.services");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");

  const [rows, providerRows] = await Promise.all([
    db
      .select({
        id: services.id,
        name: services.name,
        providerId: services.providerId,
        providerName: providers.name,
        serviceType: services.serviceType,
        basePrice: services.basePrice,
      })
      .from(services)
      .innerJoin(providers, eq(services.providerId, providers.id))
      .where(serviceType && serviceType !== "all" ? and(eq(services.serviceType, serviceType)) : undefined)
      .orderBy(services.name),
    db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name),
  ]);

  // ponytail: in-page text + provider filter; move to a DB-level filter past ~200 services.
  const filtered = rows.filter(
    (s) =>
      (provider === "all" || s.providerId === provider) &&
      (q === "" ||
        s.name.toLowerCase().includes(q) ||
        s.providerName.toLowerCase().includes(q)),
  );
  const { items, totalPages } = paginate(filtered, page);

  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const allLabel = locale === "en" ? "All" : locale === "ar" ? "الكل" : "همه";
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;
  const filterParams =
    `serviceType=${encodeURIComponent(serviceType)}&provider=${encodeURIComponent(provider)}${qParam}`;

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tServices("title") }]}
        title={tServices("title")}
        action={
          <Button nativeButton={false} render={<Link href={`${prefix}/admin/services/new`} />}>
            {tServices("newBtn")}
          </Button>
        }
      />
      <div className="mb-4">
        <AdminToolbar placeholder={tSearch("search")} searchLabel={tCommon("filter")} currentQ={q}>
          <select
            name="serviceType"
            defaultValue={serviceType ?? "all"}
            aria-label={tCommon("type")}
            className="rounded-md border border-outline-variant/50 bg-surface-container-low px-2.5 py-1 text-sm outline-none"
          >
            <option value="all">{tCommon("allTypes")}</option>
            {SERVICE_TYPES.map((typeKey) => (
              <option key={typeKey} value={typeKey}>
                {tServices(`types.${typeKey}` as any)}
              </option>
            ))}
          </select>
          <select
            name="provider"
            defaultValue={provider}
            aria-label={tCommon("provider")}
            className="rounded-md border border-outline-variant/50 bg-surface-container-low px-2.5 py-1 text-sm outline-none"
          >
            <option value="all">{allLabel}</option>
            {providerRows.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </AdminToolbar>
      </div>
      {items.length === 0 ? (
        <AdminEmpty
          title={tServices("title")}
          actionHref={`${prefix}/admin/services/new`}
          actionLabel={tServices("newBtn")}
        />
      ) : (
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
          {items.map((s) => {
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
      )}
      <div className="mt-4">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          hrefFor={(p) => `?${filterParams}&page=${p}`}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      </div>
    </div>
  );
}
