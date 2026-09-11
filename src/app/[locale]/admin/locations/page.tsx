import Link from "next/link";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { locations, providers } from "@/db/schema";
import { createLocation } from "@/contexts/catalog/actions";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination, AdminEmpty } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormDrawer } from "@/components/admin/form-drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LocationForm } from "./location-form";

export default async function AdminLocationsPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tLocations = await getTranslations("admin.locations");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");
  const tCancel = await getTranslations("common");

  const sp = (await searchParams) ?? {};
  const { q, page } = parseListParams(sp, { tabs: [], defaultTab: "" });

  const [rows, providerRows] = await Promise.all([
    db
      .select({ id: locations.id, label: locations.label, providerName: providers.name, cityId: locations.cityId, phone: locations.phone })
      .from(locations)
      .innerJoin(providers, eq(locations.providerId, providers.id))
      .orderBy(locations.label),
    db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name),
  ]);

  // ponytail: in-page text filter; move to a DB-level filter past ~200 locations.
  const filtered = rows.filter(
    (l) =>
      q === "" ||
      l.label.toLowerCase().includes(q) ||
      l.providerName.toLowerCase().includes(q) ||
      (l.phone ?? "").toLowerCase().includes(q),
  );
  const { items, totalPages } = paginate(filtered, page);

  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tLocations("title") }]}
        title={tLocations("title")}
        action={
          <FormDrawer
            openLabel={tLocations("newBtn")}
            title={tLocations("newTitle")}
            closeLabel={tCancel("cancel")}
          >
            <LocationForm action={createLocation} providers={providerRows} locale={locale} />
          </FormDrawer>
        }
      />
      <div className="mb-4">
        <AdminToolbar placeholder={tSearch("search")} searchLabel={tCommon("filter")} currentQ={q} />
      </div>
      {items.length === 0 ? (
        <AdminEmpty
          title={tLocations("title")}
          actionHref={`${prefix}/admin/locations/new`}
          actionLabel={tLocations("newBtn")}
        />
      ) : (
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
          {items.map((l) => (
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
