import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const notifications = pgTable(
  "notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(), // appointment_confirmed | appointment_reminder | support_reply | system
    title: text("title").notNull(), // Persian base
    body: text("body").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notification_user_unread").on(t.userId, t.read)],
);