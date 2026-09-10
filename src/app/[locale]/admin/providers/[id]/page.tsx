import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { providers, practitioners, serviceCategories, translations, availabilitySlots } from "@/db/schema";
import { createProvider, updateProvider } from "@/contexts/catalog/actions";
import { listSchedules, listExceptions, listProviderServices } from "@/contexts/catalog/queries";
import { listBookingsForDoctor } from "@/contexts/booking/queries";
import { ProviderForm } from "../provider-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ScheduleTab } from "./schedule-tab";
import { SlotsTab } from "./slots-tab";
import { BookingsTab } from "./bookings-tab";

const TABS = ["profile", "schedules", "slots", "bookings"] as const;
type Tab = (typeof TABS)[number];

function resolveTab(raw?: string): Tab {
  return (TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "profile";
}

export default async function AdminProviderEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; locale?: string }>;
  searchParams?: Promise<{ tab?: string; serviceId?: string; date?: string }>;
}) {
  const { id, locale } = await params;
  const query = searchParams ? await searchParams : {};
  const activeLocale = locale ?? "fa";
  const tProviders = await getTranslations("admin.providers");
  const tScheduling = await getTranslations("admin.scheduling");
  const tNav = await getTranslations("admin.nav");

  if (id === "new") {
    const specialties = await db
      .select({ id: serviceCategories.id, name: serviceCategories.name })
      .from(serviceCategories)
      .orderBy(serviceCategories.name);
    return (
      <div className="text-start">
        <AdminPageHeader
          crumbs={[
            { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
            { label: tProviders("title"), href: `/${activeLocale}/admin/providers` },
            { label: tProviders("newTitle") },
          ]}
          title={tProviders("newTitle")}
        />
        <ProviderForm action={createProvider} specialties={specialties} locale={locale} />
      </div>
    );
  }

  const [provider] = await db.select().from(providers).where(eq(providers.id, id));
  if (!provider) notFound();

  const tab = resolveTab(query.tab);
  const base = `/${activeLocale}/admin/providers/${id}`;

  const nav = (
    <nav aria-label={provider.name} className="mb-6 flex flex-wrap gap-2">
      {TABS.map((t) => (
        <Link
          key={t}
          href={`${base}?tab=${t}`}
          aria-current={tab === t ? "page" : undefined}
          className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
            tab === t
              ? "bg-primary text-on-primary"
              : "bg-surface-container-low text-on-surface hover:bg-surface-container"
          }`}
        >
          {tScheduling(`tabs.${t}`)}
        </Link>
      ))}
    </nav>
  );

  if (tab === "schedules") {
    const [services, schedules] = await Promise.all([
      listProviderServices(id, activeLocale),
      listSchedules(id),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const plus90 = new Date(Date.now() + 90 * 86400_000).toISOString().slice(0, 10);
    const exceptions = await listExceptions(id, today, plus90);
    return (
      <div className="text-start">
        <AdminPageHeader
          crumbs={[
            { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
            { label: tProviders("title"), href: `/${activeLocale}/admin/providers` },
            { label: provider.name },
          ]}
          title={provider.name}
        />
        {nav}
        <ScheduleTab
          providerId={id}
          services={services}
          initialServiceId={query.serviceId ?? services[0]?.id ?? ""}
          schedules={schedules}
          exceptions={exceptions}
          locale={activeLocale}
        />
      </div>
    );
  }

  if (tab === "slots") {
    const services = await listProviderServices(id, activeLocale);
    const serviceId = query.serviceId || undefined;
    const date = query.date ?? new Date().toISOString().slice(0, 10);
    const dayStart = new Date(`${date}T00:00:00Z`);
    const dayEnd = new Date(`${date}T23:59:59Z`);
    const slotRows = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.providerId, id),
          serviceId ? eq(availabilitySlots.serviceId, serviceId) : undefined,
          sql`${availabilitySlots.startsAt} >= ${dayStart} AND ${availabilitySlots.startsAt} <= ${dayEnd}`,
        ),
      )
      .orderBy(availabilitySlots.startsAt)
      .limit(100);
    return (
      <div className="text-start">
        <AdminPageHeader
          crumbs={[
            { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
            { label: tProviders("title"), href: `/${activeLocale}/admin/providers` },
            { label: provider.name },
          ]}
          title={provider.name}
        />
        {nav}
        <SlotsTab
          providerId={id}
          services={services}
          initialServiceId={serviceId ?? ""}
          date={date}
          slots={slotRows.map((s) => ({
            id: s.id,
            startsAt: s.startsAt.toISOString(),
            capacity: s.capacity,
            bookedCount: s.bookedCount,
            isActive: s.isActive,
          }))}
          locale={activeLocale}
        />
      </div>
    );
  }

  if (tab === "bookings") {
    const bookings = await listBookingsForDoctor(id);
    return (
      <div className="text-start">
        <AdminPageHeader
          crumbs={[
            { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
            { label: tProviders("title"), href: `/${activeLocale}/admin/providers` },
            { label: provider.name },
          ]}
          title={provider.name}
        />
        {nav}
        <BookingsTab
          bookings={bookings.map((b) => ({ ...b, startsAt: b.startsAt?.toISOString() ?? null }))}
          locale={activeLocale}
        />
      </div>
    );
  }

  const specialties = await db
    .select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .orderBy(serviceCategories.name);
  const [practitioner] = await db.select().from(practitioners).where(eq(practitioners.providerId, id));
  const overrides = await db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, "provider"), eq(translations.entityId, id)));

  const initial: Record<string, string> = {
    kind: provider.kind,
    orgType: provider.orgType ?? "",
    nameFa: provider.name,
    phone: provider.phone ?? "",
    specialtyId: practitioner?.specialtyId ?? "",
    bioFa: practitioner?.bio ?? "",
  };
  for (const o of overrides) {
    if (o.field === "name" && (o.locale === "en" || o.locale === "ar")) initial[`name${o.locale === "en" ? "En" : "Ar"}`] = o.value;
  }

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[
          { label: tNav("dashboard"), href: `/${activeLocale}/admin` },
          { label: tProviders("title"), href: `/${activeLocale}/admin/providers` },
          { label: tProviders("editTitle") },
        ]}
        title={tProviders("editTitle")}
      />
      {nav}
      <ProviderForm
        action={updateProvider.bind(null, id)}
        initial={initial}
        specialties={specialties}
        locale={locale}
      />
    </div>
  );
}
