"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { supportRequests, notifications, users } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";

function parseOrError<T>(schema: z.ZodType<T>, input: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(input);
  if (!r.success) return { ok: false, error: r.error.issues.map((i) => i.message).join("; ") };
  return { ok: true, data: r.data };
}

const supportSchema = z.object({
  kind: z.enum(["question", "complaint", "appointment_issue"]),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
  appointmentId: z.string().optional(),
  serviceId: z.string().optional(),
  providerId: z.string().optional(),
});

export async function createSupportRequest(input: z.infer<typeof supportSchema>) {
  const user = await requireUser();
  const parsed = parseOrError(supportSchema, input);
  if (!parsed.ok) return parsed;
  const data = parsed.data;
  const id = randomUUID();
  await db.insert(supportRequests).values({ id, userId: user.id, ...data });
  return { ok: true as const, id };
}

const REQUEST_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);

function isRequestStatus(value: string): value is "open" | "in_progress" | "resolved" | "closed" {
  return REQUEST_STATUSES.has(value);
}

export async function updateRequestStatus(id: string, status: "open" | "in_progress" | "resolved" | "closed" | FormData) {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false as const, reason: "forbidden" };
  const value = status instanceof FormData ? String(status.get("status") ?? "") : status;
  if (!isRequestStatus(value)) return { ok: false as const, reason: "bad_status" };
  const [row] = await db.select().from(supportRequests).where(eq(supportRequests.id, id));
  if (!row) return { ok: false as const, reason: "not_found" };
  return db.transaction(async (tx) => {
    await tx.update(supportRequests).set({ status: value, updatedAt: new Date() }).where(eq(supportRequests.id, id));
    await tx.insert(notifications).values({
      id: randomUUID(),
      userId: row.userId,
      kind: "support_reply",
      title: "Support request updated",
      body: `Your request "${row.subject}" is now ${value}.`,
    });
    return { ok: true as const };
  });
}

export async function assignRequest(id: string, assigneeUserId: string) {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false as const, reason: "forbidden" };
  if (!id || !assigneeUserId) return { ok: false as const, reason: "bad_input" };
  const [assignee] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, assigneeUserId));
  if (!assignee || assignee.role !== "admin") return { ok: false as const, reason: "bad_assignee" };
  return db.transaction(async (tx) => {
    await tx
      .update(supportRequests)
      .set({ assigneeUserId, updatedAt: new Date() })
      .where(eq(supportRequests.id, id));
    await tx.insert(notifications).values({
      id: randomUUID(),
      userId: assigneeUserId,
      kind: "support_reply",
      title: "Request assigned",
      body: `A support request was assigned to you.`,
    });
    return { ok: true as const };
  });
}

export async function updateRequestPriority(id: string, priority: "normal" | "high") {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false as const, reason: "forbidden" };
  if (priority !== "normal" && priority !== "high") return { ok: false as const, reason: "bad_priority" };
  await db
    .update(supportRequests)
    .set({ priority, updatedAt: new Date() })
    .where(eq(supportRequests.id, id));
  return { ok: true as const };
}

export async function markNotificationsRead(_formData: FormData) {
  const user = await requireUser();
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
}