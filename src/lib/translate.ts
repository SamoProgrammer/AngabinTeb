import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { translations } from "@/db/schema";

type Row = Record<string, unknown>;
type Override = { entityType: string; entityId: string; locale: string; field: string; value: string };

// Ruling R18: entityType is a leading param — overrides are scoped per entity
// type so a "provider" override can never touch a "service" row that shares an id.
export async function localizedRows<T extends Row>(
  entityType: string,
  rows: T[],
  locale: string,
  fields: string[],
  dbc: typeof db = db,
): Promise<T[]> {
  if (rows.length === 0) return rows;
  const overrides: Override[] = await dbc
    .select()
    .from(translations)
    .where(and(eq(translations.entityType, entityType), inArray(translations.entityId, rows.map((r) => r.id as string))));
  if (overrides.length === 0) return rows;
  const byId = new Map(overrides.map((o) => [`${o.entityType}:${o.entityId}:${o.field}:${o.locale}`, o]));
  return rows.map((row) => {
    const out: Row = { ...row };
    for (const field of fields) {
      const match = byId.get(`${entityType}:${row.id}:${field}:${locale}`);
      if (match) out[field] = match.value;
    }
    return out as T;
  });
}
