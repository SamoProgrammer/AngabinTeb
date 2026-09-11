import "server-only";
import { cache } from "react";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clinicalMessages, supportRequests, notifications } from "@/db/schema";

export const listRequests = cache(async (filter?: { userId?: string; status?: string }) => {
  const q = db.select().from(supportRequests);
  const where = and(
    filter?.userId ? eq(supportRequests.userId, filter.userId) : undefined,
    filter?.status ? eq(supportRequests.status, filter.status) : undefined,
  );
  if (where) q.where(where);
  return q.orderBy(desc(supportRequests.createdAt)).limit(100);
});

export const listNotifications = cache(async (userId: string) => {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
});

export const unreadCount = cache(async (userId: string) => {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return row?.total ?? 0;
});

export const unreadInboxCount = cache(async (userId: string) => {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(clinicalMessages)
    .where(and(eq(clinicalMessages.recipientUserId, userId), eq(clinicalMessages.isRead, false)));
  return row?.total ?? 0;
});