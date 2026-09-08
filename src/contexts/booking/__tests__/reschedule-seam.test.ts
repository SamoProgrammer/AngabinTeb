import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Same stub as booking-seam.test.ts: the seams under test never call
// requireUser, so avoid booting the Next auth stack inside vitest.
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

import * as schema from "@/db/schema";
import { resetRateLimit } from "@/lib/rate-limit";
import { bookAppointmentWithUser, rescheduleAppointmentWithUser } from "../actions";

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";

const runId = randomUUID().slice(0, 8);
const dbName = `angabin_resched_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const providerId = `resched-prov-${runId}`;
const categoryId = `resched-cat-${runId}`;
const serviceId = `resched-svc-${runId}`;
const userId = `resched-user-${runId}`;
const otherId = `resched-other-${runId}`;
let slotSeq = 0;

const futureSlot = (capacity: number) => {
  slotSeq += 1;
  const startsAt = new Date(Date.now() + 24 * 3_600_000 + slotSeq * 3_600_000);
  return {
    id: `resched-slot-${runId}-${slotSeq}`,
    providerId,
    serviceId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 30 * 60_000),
    capacity,
  };
};

const slotCount = async (slotId: string) => {
  const [row] = await testDb
    .select()
    .from(schema.availabilitySlots)
    .where(eq(schema.availabilitySlots.id, slotId));
  return row.bookedCount as number;
};

const appointmentStatus = async (appointmentId: string) => {
  const [row] = await testDb
    .select()
    .from(schema.appointments)
    .where(eq(schema.appointments.id, appointmentId));
  return row;
};

beforeAll(async () => {
  try {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      console.warn(SKIP + " (DATABASE_URL is not set)");
      return;
    }
    const testUrl = baseUrl.replace(/\/[^/?]*(\?|$)/, `/${dbName}$1`);
    admin = postgres(baseUrl, { max: 1 });
    testClient = postgres(testUrl, { max: 5 });
    testDb = drizzle(testClient, { schema });
    await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    await migrate(testDb, {
      migrationsFolder: fileURLToPath(new URL("../../../db/migrations", import.meta.url)),
    });
    await testDb.insert(schema.providers).values({ id: providerId, kind: "person", name: "Resched Doctor" });
    await testDb
      .insert(schema.serviceCategories)
      .values({ id: categoryId, slug: `resched-cat-${runId}`, name: "Resched Category" });
    await testDb.insert(schema.services).values({
      id: serviceId,
      providerId,
      categoryId,
      serviceType: "consultation",
      name: "Resched Service",
      durationMinutes: 30,
      basePrice: "0",
    });
    await testDb.insert(schema.users).values([
      { id: userId, name: "Resched User" },
      { id: otherId, name: "Resched Other" },
    ]);
    ready = true;
  } catch (e) {
    console.warn(`${SKIP} (${e instanceof Error ? e.message : String(e)})`);
    try {
      if (testClient) await testClient.end();
    } catch {
      // ignore teardown errors on an unreachable database
    }
    try {
      if (admin) await admin.end();
    } catch {
      // ignore teardown errors on an unreachable database
    }
    admin = null;
    testClient = null;
    testDb = null;
  }
}, 120_000);

afterAll(async () => {
  if (testClient) {
    try {
      await testClient.end();
    } catch {
      // ignore teardown errors on an unreachable database
    }
  }
  if (admin) {
    await admin.unsafe(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    await admin.end();
  }
});

beforeEach(() => {
  resetRateLimit();
});

describe("reschedule action seam (disposable database)", () => {
  it("frees the old slot, preserves the cancelled record, and keeps patient fields", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const [oldSlot] = await testDb.insert(schema.availabilitySlots).values(futureSlot(2)).returning();
    const [newSlot] = await testDb.insert(schema.availabilitySlots).values(futureSlot(2)).returning();

    const booked = await bookAppointmentWithUser(
      { id: userId },
      {
        serviceId,
        slotId: oldSlot.id,
        partySize: 1,
        patientName: "سارا محمدی",
        patientPhone: "+989123456789",
        notes: "headache",
        idempotencyKey: randomUUID(),
      },
      testDb,
    );
    expect(booked.ok).toBe(true);
    if (!booked.ok) return;
    expect(await slotCount(oldSlot.id)).toBe(1);

    const res = await rescheduleAppointmentWithUser({ id: userId }, booked.appointmentId, newSlot.id, testDb);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Old slot capacity freed, new slot takes it.
    expect(await slotCount(oldSlot.id)).toBe(0);
    expect(await slotCount(newSlot.id)).toBe(1);

    // Cancelled record preserved; new booking confirmed with the same identity.
    const oldRow = await appointmentStatus(booked.appointmentId);
    expect(oldRow.status).toBe("cancelled");
    const newRow = await appointmentStatus(res.appointmentId);
    expect(newRow.status).toBe("confirmed");
    expect(newRow.slotId).toBe(newSlot.id);
    expect(newRow.patientName).toBe("سارا محمدی");
    expect(newRow.patientPhone).toBe("+989123456789");
    expect(newRow.notes).toBe("headache");
    expect(newRow.partySize).toBe(1);
  });

  it("capacity failure leaves the original booking and its slot untouched", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const [oldSlot] = await testDb.insert(schema.availabilitySlots).values(futureSlot(2)).returning();
    const [fullSlot] = await testDb.insert(schema.availabilitySlots).values(futureSlot(1)).returning();
    const filler = await bookAppointmentWithUser(
      { id: otherId },
      { serviceId, slotId: fullSlot.id, partySize: 1, idempotencyKey: randomUUID() },
      testDb,
    );
    expect(filler.ok).toBe(true);

    const booked = await bookAppointmentWithUser(
      { id: userId },
      { serviceId, slotId: oldSlot.id, partySize: 1, idempotencyKey: randomUUID() },
      testDb,
    );
    expect(booked.ok).toBe(true);
    if (!booked.ok) return;

    const res = await rescheduleAppointmentWithUser({ id: userId }, booked.appointmentId, fullSlot.id, testDb);
    expect(res).toEqual({ ok: false, reason: "capacity_exceeded" });

    const oldRow = await appointmentStatus(booked.appointmentId);
    expect(oldRow.status).toBe("confirmed");
    expect(await slotCount(oldSlot.id)).toBe(1);
    expect(await slotCount(fullSlot.id)).toBe(1);
  });

  it("concurrent reschedules onto a capacity-1 slot confirm exactly once", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const [slotA] = await testDb.insert(schema.availabilitySlots).values(futureSlot(2)).returning();
    const [slotB] = await testDb.insert(schema.availabilitySlots).values(futureSlot(2)).returning();
    const [target] = await testDb.insert(schema.availabilitySlots).values(futureSlot(1)).returning();

    const first = await bookAppointmentWithUser(
      { id: userId },
      { serviceId, slotId: slotA.id, partySize: 1, idempotencyKey: randomUUID() },
      testDb,
    );
    const second = await bookAppointmentWithUser(
      { id: otherId },
      { serviceId, slotId: slotB.id, partySize: 1, idempotencyKey: randomUUID() },
      testDb,
    );
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const [r1, r2] = await Promise.all([
      rescheduleAppointmentWithUser({ id: userId }, first.appointmentId, target.id, testDb),
      rescheduleAppointmentWithUser({ id: otherId }, second.appointmentId, target.id, testDb),
    ]);
    const oks = [r1, r2].filter((r) => r.ok);
    expect(oks).toHaveLength(1);
    expect(await slotCount(target.id)).toBe(1);
  });
});
