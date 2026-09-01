"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireUser } from "@/contexts/identity/actions";
import { initiatePayment, verifyPayment } from "@/lib/payments";
import { nextPaymentState } from "./kernel";

export async function startPayment(appointmentId: string) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.patientId, user.id)));
  if (!row) return { ok: false as const, reason: "not_found" };
  if (row.paymentStatus !== "unpaid") return { ok: false as const, reason: "already_paid" };
  const { redirectUrl } = await initiatePayment(appointmentId, row.price);
  return { ok: true as const, redirectUrl };
}

export async function completePayment(appointmentId: string, token: string) {
  const user = await requireUser();
  const result = await verifyPayment(token);
  if (!result.ok) return result;

  const [row] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.patientId, user.id)));
  if (!row) return { ok: false as const, reason: "not_found" };

  const next = nextPaymentState(row.paymentStatus as "pending" | "paid_online" | "unpaid", true);
  if (next === "paid_online") {
    await db.update(appointments)
      .set({ paymentStatus: "paid_online", status: "confirmed" })
      .where(eq(appointments.id, appointmentId));
  }
  return { ok: true as const, paymentStatus: next };
}