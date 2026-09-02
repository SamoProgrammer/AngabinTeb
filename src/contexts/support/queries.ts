import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { supportRequests, notifications } from "@/db/schema";

export async function myRequests(userId: string) {
  return db
    .select()
    .from(supportRequests)
    .where(eq(supportRequests.userId, userId))
    .orderBy(desc(supportRequests.createdAt))
    .limit(100);
}

export async function listRequests(status?: string) {
  const q = db.select().from(supportRequests);
  if (status) q.where(eq(supportRequests.status, status));
  return q.orderBy(desc(supportRequests.createdAt)).limit(100);
}

export async function listNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function unreadCount(userId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return row?.total ?? 0;
}