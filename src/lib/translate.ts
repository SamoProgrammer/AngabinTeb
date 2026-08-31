type Row = Record<string, unknown>;
type Override = { entityType: string; entityId: string; locale: string; field: string; value: string };

// Ruling R18: entityType is a leading param — overrides are scoped per entity
// type so a "provider" override can never touch a "service" row that shares an id.
export function overlayTranslations<T extends Row>(
  entityType: string,
  rows: T[],
  overrides: Override[],
  locale: string,
  fields: string[],
): T[] {
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