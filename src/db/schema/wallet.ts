import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const wallets = pgTable("wallet", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 12, scale: 0 }).notNull().default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transaction", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 0 }).notNull(),
  type: text("type").notNull(), // credit | debit
  title: text("title").notNull(),
  bankRefCode: text("bank_ref_code"),
  status: text("status").notNull().default("success"), // success | failed | pending
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
