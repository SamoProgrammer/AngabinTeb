import { pgTable, text, primaryKey, index } from "drizzle-orm/pg-core";

export const translations = pgTable(
  "translation",
  {
    entityType: text("entity_type").notNull(), // service | provider | food | content | ...
    entityId: text("entity_id").notNull(),
    locale: text("locale").notNull(),          // fa | en | ar (fa overrides never written)
    field: text("field").notNull(),            // name | title | bio | ...
    value: text("value").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.entityType, t.entityId, t.locale, t.field] }),
    index("translation_lookup").on(t.entityType, t.entityId),
  ],
);