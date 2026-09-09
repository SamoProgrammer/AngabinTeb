import "server-only";
import { cache } from "react";
import { sql, eq, and, or } from "drizzle-orm";
import { db } from "@/db";
import { providers, practitioners, services, locations, serviceCategories, diagnosticServices, contents } from "@/db/schema";
import { localizedRows } from "@/lib/translate";
import type { SearchResult, DoctorCard, ServiceCard } from "./model";
export type { SearchResult, DoctorCard, ServiceCard };

// Pages pass either a category id or a slug (?specialty=cardiology).
// Resolve slugs to ids so the filter matches seeded rows instead of
// silently returning zero results.
async function resolveCategoryId(idOrSlug: string): Promise<string | null> {
  const [cat] = await db
    .select({ id: serviceCategories.id })
    .from(serviceCategories)
    .where(
      or(
        eq(serviceCategories.id, idOrSlug),
        eq(serviceCategories.slug, idOrSlug),
      ),
    );
  return cat?.id ?? null;
}

export const searchAll = cache(async (term: string, locale: string): Promise<SearchResult[]> => {
  if (!term.trim()) return [];
  const q = sql`plainto_tsquery('simple', ${term.trim()})`;

  const svc = await db
    .select({
      id: services.id,
      name: services.name,
      type: sql<string>`'service'`,
      providerName: providers.name,
      serviceType: services.serviceType,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .where(and(sql`to_tsvector('simple', ${services.name}) @@ ${q}`, eq(services.isActive, true)))
    .limit(20);

  const docs = await db
    .select({
      id: providers.id,
      name: providers.name,
      bio: practitioners.bio,
      specialtyName: serviceCategories.name,
      kind: providers.kind,
    })
    .from(providers)
    .leftJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .where(and(
      sql`to_tsvector('simple', coalesce(${providers.name},'') || ' ' || coalesce(${practitioners.bio},'')) @@ ${q}`,
      eq(providers.isActive, true),
    ))
    .limit(20);

  const localizedServices = await localizedRows("service", svc, locale, ["name"]);
  const localizedDocs = await localizedRows("provider", docs, locale, ["name"]);

  const cnt = await db
    .select({ id: contents.id, slug: contents.slug, title: contents.title })
    .from(contents)
    .where(and(
      sql`to_tsvector('simple', ${contents.title}) @@ ${q}`,
      eq(contents.status, "published"),
    ))
    .limit(10);

  const contentOverrides = await localizedRows("content", cnt, locale, ["title"]);

  const results: SearchResult[] = [
    ...localizedServices.map((s) => ({
      type: "service" as const,
      id: s.id,
      title: s.name as string,
      subtitle: `${s.providerName} · ${s.serviceType}`,
      href: `/services/${s.id}`,
    })),
    ...localizedDocs.map((d) => ({
      type: (d.kind === "organization" ? "clinic" : "doctor") as "clinic" | "doctor",
      id: d.id,
      title: d.name as string,
      subtitle: (d.bio as string) ?? (d.specialtyName as string) ?? "",
      href: `/doctors/${d.id}`,
    })),
    ...contentOverrides.map((c) => ({
      type: "content" as const,
      id: c.id,
      title: c.title as string,
      subtitle: "Article",
      href: `/articles/${c.slug}`,
    })),
  ];
  return results.sort((a, b) => a.title.localeCompare(b.title, locale));
});

export const listDoctors = cache(async (
  locale: string,
  specialtyId?: string,
  cityId?: string,
  page = 1,
  pageSize = 12,
): Promise<{ rows: DoctorCard[]; total: number }> => {
  // Pages pass either a category id or a slug (?specialty=cardiology).
  const specialtyDbId = specialtyId ? await resolveCategoryId(specialtyId) : undefined;
  if (specialtyId && !specialtyDbId) return { rows: [], total: 0 };
  const where = and(
    eq(providers.kind, "person"),
    eq(providers.isActive, true),
    specialtyDbId ? eq(practitioners.specialtyId, specialtyDbId) : undefined,
    cityId ? eq(locations.cityId, cityId) : undefined,
  );
  const [count] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(providers)
    .innerJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .leftJoin(locations, eq(locations.id, providers.primaryLocationId))
    .where(where);
  const rows = await db
    .select({
      id: providers.id,
      name: providers.name,
      specialty: serviceCategories.name,
      cityId: locations.cityId,
      imageUrl: providers.imageUrl,
      medicalCouncilCode: practitioners.medicalCouncilCode,
    })
    .from(providers)
    .innerJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .leftJoin(locations, eq(locations.id, providers.primaryLocationId))
    .where(where)
    .orderBy(providers.name)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    rows: (await localizedRows("provider", rows, locale, ["name"])) as DoctorCard[],
    total: count?.total ?? 0,
  };
});

export const listServices = cache(async (
  locale: string,
  categoryId?: string,
  cityId?: string,
  page = 1,
  pageSize = 12,
): Promise<{ rows: ServiceCard[]; total: number }> => {
  // Pages pass either a category id or a slug (?category=laboratory).
  const categoryDbId = categoryId ? await resolveCategoryId(categoryId) : undefined;
  if (categoryId && !categoryDbId) return { rows: [], total: 0 };
  const where = and(
    eq(services.isActive, true),
    categoryDbId ? eq(services.categoryId, categoryDbId) : undefined,
    cityId ? eq(locations.cityId, cityId) : undefined,
  );
  const [count] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, services.categoryId))
    .leftJoin(locations, eq(locations.id, services.locationId))
    .where(where);
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      providerName: providers.name,
      serviceType: services.serviceType,
      category: serviceCategories.name,
      cityId: locations.cityId,
      price: services.basePrice,
      durationMinutes: services.durationMinutes,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, services.categoryId))
    .leftJoin(locations, eq(locations.id, services.locationId))
    .where(where)
    .orderBy(services.name)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  return {
    rows: (await localizedRows("service", rows, locale, ["name"])) as ServiceCard[],
    total: count?.total ?? 0,
  };
});

export const getDoctor = cache(async (id: string, locale: string) => {
  const [row] = await db
    .select({
      id: providers.id,
      kind: providers.kind,
      name: providers.name,
      phone: providers.phone,
      imageUrl: providers.imageUrl,
      bio: practitioners.bio,
      credentials: practitioners.credentials,
      cvUrl: practitioners.cvUrl,
      videoUrl: practitioners.videoUrl,
      medicalCouncilCode: practitioners.medicalCouncilCode,
      landlinePhone: practitioners.landlinePhone,
      specialtyName: serviceCategories.name,
      addressLine: locations.addressLine,
      cityId: locations.cityId,
      latitude: locations.latitude,
      longitude: locations.longitude,
    })
    .from(providers)
    .leftJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .leftJoin(locations, eq(locations.id, providers.primaryLocationId))
    .where(eq(providers.id, id));
  if (!row) return null;
  return (await localizedRows("provider", [row], locale, ["name", "bio"]))[0];
});

export const getService = cache(async (id: string, locale: string) => {
  const [row] = await db
    .select({
      id: services.id,
      serviceType: services.serviceType,
      name: services.name,
      providerId: services.providerId,
      providerName: providers.name,
      providerPhone: providers.phone,
      durationMinutes: services.durationMinutes,
      basePrice: services.basePrice,
      locationId: services.locationId,
      addressLine: locations.addressLine,
      cityId: locations.cityId,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .leftJoin(locations, eq(locations.id, services.locationId))
    .where(and(eq(services.id, id), eq(services.isActive, true)));
  if (!row) return null;
  return (await localizedRows("service", [row], locale, ["name"]))[0];
});

export const listProviderServices = cache(async (providerId: string, locale: string) => {
  const rows = await db
    .select({ id: services.id, name: services.name, basePrice: services.basePrice })
    .from(services)
    .where(and(eq(services.providerId, providerId), eq(services.isActive, true)))
    .orderBy(services.name)
    .limit(10);
  return localizedRows("service", rows, locale, ["name"]);
});

export const getPrepInfo = cache(async (serviceId: string) => {
  const [row] = await db
    .select({ prepInstructions: diagnosticServices.prepInstructions, fastingHours: diagnosticServices.fastingHours })
    .from(diagnosticServices)
    .where(eq(diagnosticServices.serviceId, serviceId));
  return row ?? null;
});