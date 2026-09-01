import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportRequests } from "@/db/schema";

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