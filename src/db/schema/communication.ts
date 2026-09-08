import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { users } from "./identity";
import { providers } from "./catalog";

export const clinicalMessages = pgTable("clinical_message", {
  id: text("id").primaryKey(),
  recipientUserId: text("recipient_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderDoctorId: text("sender_doctor_id").references(() => providers.id),
  senderDoctorName: text("sender_doctor_name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  attachmentUrl: text("attachment_url"),
  isRead: boolean("is_read").notNull().default(false),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
