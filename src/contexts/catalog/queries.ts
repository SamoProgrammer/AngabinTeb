import "server-only";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { providers, practitioners, services, locations, serviceCategories, translations, diagnosticServices } from "@/db/schema";
import { overlayTranslations } from "@/lib/translate";
import type { SearchResult, DoctorCard, ServiceCard } from "./model";

export async function fetchOverrides(entityType: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, entityType), sql`${translations.entityId} = any(${ids}::text[])`));
}

export async function searchAll(term: string, locale: string): Promise<SearchResult[]> {
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

  const overrides = await fetchOverrides("service", svc.map((r) => r.id));
  const docOverrides = await fetchOverrides("provider", docs.map((r) => r.id));

  const localizedServices = overlayTranslations("service", svc, overrides, locale, ["name"]);
  const localizedDocs = overlayTranslations("provider", docs, docOverrides, locale, ["name"]);

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
  ];
  return results.sort((a, b) => a.title.localeCompare(b.title, locale));
}

export async function listDoctors(locale: string, specialtyId?: string, cityId?: string): Promise<DoctorCard[]> {
  const rows = await db
    .select({
      id: providers.id,
      name: providers.name,
      specialty: serviceCategories.name,
      cityId: locations.cityId,
      imageUrl: providers.imageUrl,
    })
    .from(providers)
    .innerJoin(practitioners, eq(practitioners.providerId, providers.id))
    .leftJoin(serviceCategories, eq(serviceCategories.id, practitioners.specialtyId))
    .leftJoin(locations, eq(locations.id, providers.primaryLocationId))
    .where(and(
      eq(providers.kind, "person"),
      eq(providers.isActive, true),
      specialtyId ? eq(practitioners.specialtyId, specialtyId) : undefined,
      cityId ? eq(locations.cityId, cityId) : undefined,
    ))
    .orderBy(providers.name);
  return overlayTranslations("provider", rows, await fetchOverrides("provider", rows.map((r) => r.id)), locale, ["name"]) as DoctorCard[];
}

export async function listServices(locale: string, categoryId?: string, cityId?: string): Promise<ServiceCard[]> {
  const rows = await db
    .select({
      id: services.id,
      name: services.name,
      providerName: providers.name,
      serviceType: services.serviceType,
      cityId: locations.cityId,
      price: services.basePrice,
    })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .leftJoin(locations, eq(locations.id, services.locationId))
    .where(and(
      eq(services.isActive, true),
      categoryId ? eq(services.categoryId, categoryId) : undefined,
      cityId ? eq(locations.cityId, cityId) : undefined,
    ))
    .orderBy(services.name)
    .limit(50);
  return overlayTranslations("service", rows, await fetchOverrides("service", rows.map((r) => r.id)), locale, ["name"]) as ServiceCard[];
}

export async function getDoctor(id: string, locale: string) {
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
  return overlayTranslations("provider", [row], await fetchOverrides("provider", [id]), locale, ["name", "bio"])[0];
}

export async function getService(id: string, locale: string) {
  const [row] = await db
    .select({
      id: services.id,
      serviceType: services.serviceType,
      name: services.name,
      providerId: services.providerId,
      providerName: providers.name,
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
  return overlayTranslations("service", [row], await fetchOverrides("service", [id]), locale, ["name"])[0];
}

export async function getPrepInfo(serviceId: string) {
  const [row] = await db
    .select({ prepInstructions: diagnosticServices.prepInstructions, fastingHours: diagnosticServices.fastingHours })
    .from(diagnosticServices)
    .where(eq(diagnosticServices.serviceId, serviceId));
  return row ?? null;
}