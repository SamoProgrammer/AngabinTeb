import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// The booking action imports requireUser at module top; the seam under test
// (bookAppointmentWithUser) never calls it, so stub the module instead of
// booting the Next auth stack inside vitest.
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

import * as schema from "@/db/schema";
import { resetRateLimit } from "@/lib/rate-limit";
import { bookAppointmentWithUser } from "../actions";

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";

const runId = randomUUID().slice(0, 8);
const dbName = `angabin_seam_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const providerId = `seam-prov-${runId}`;
const categoryId = `seam-cat-${runId}`;
const serviceId = `seam-svc-${runId}`;
let slotSeq = 0;

const futureSlot = (capacity: number, hold?: { until: Date | null; by?: string }) => {
  slotSeq += 1;
  const startsAt = new Date(Date.now() + 24 * 3_600_000 + slotSeq * 3_600_000);
  return {
    id: `seam-slot-${runId}-${slotSeq}`,
    providerId,
    serviceId,
    startsAt,
    endsAt: new Date(startsAt.getTime() + 30 * 60_000),
    capacity,
    heldUntil: hold?.until ?? null,
    heldBy: hold?.until ? (hold.by ?? `holder-${runId}`) : null,
  };
};

const book = (
  userId: string,
  slotId: string,
  partySize: number,
  svcId: string = serviceId,
) =>
  bookAppointmentWithUser(
    { id: userId },
    { serviceId: svcId, slotId, partySize, idempotencyKey: randomUUID() },
    testDb,
  );

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
    await testDb.insert(schema.providers).values({ id: providerId, kind: "person", name: "Seam Doctor" });
    await testDb
      .insert(schema.serviceCategories)
      .values({ id: categoryId, slug: `seam-cat-${runId}`, name: "Seam Category" });
    await testDb.insert(schema.services).values({
      id: serviceId,
      providerId,
      categoryId,
      serviceType: "consultation",
      name: "Seam Service",
      durationMinutes: 30,
      basePrice: "0",
    });
    // The booking action always writes an appointment_confirmed notification,
    // and notification.user_id references user.id — pre-create every synthetic
    // booking user so the FK never trips inside the transaction.
    await testDb.insert(schema.users).values(
      ["a", "b", "c", "d", "e", "f", "g"].map((s) => ({
        id: `seam-user-${runId}-${s}`,
        name: `Seam User ${s}`,
      })),
    );
    ready = true;
  } catch (e) {
    console.warn(`${SKIP} (${e instanceof Error ? e.message : String(e)})`);
    // Tear down the clients so background reconnect attempts never surface
    // as unhandled errors: a skipped suite must stay green, not fail.
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

describe("booking action seam (disposable database)", () => {
  it("concurrent double-book on a capacity-1 slot yields exactly one confirmation", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const [slot] = await testDb.insert(schema.availabilitySlots).values(futureSlot(1)).returning();
    const [a, b] = await Promise.all([
      book(`seam-user-${runId}-a`, slot.id, 1),
      book(`seam-user-${runId}-b`, slot.id, 1),
    ]);
    const oks = [a, b].filter((r) => r.ok);
    expect(oks).toHaveLength(1);
    const loser = [a, b].find((r) => !r.ok);
    expect(loser).toEqual({ ok: false, reason: "capacity_exceeded" });

    const [row] = await testDb
      .select()
      .from(schema.availabilitySlots)
      .where(eq(schema.availabilitySlots.id, slot.id));
    expect(row.bookedCount).toBe(1);
    const appointments = await testDb
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.slotId, slot.id));
    expect(appointments.filter((r: { status: string }) => r.status === "confirmed")).toHaveLength(1);
  });

  it("expired hold frees the slot; active hold blocks it", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const [freed] = await testDb
      .insert(schema.availabilitySlots)
      .values(futureSlot(1, { until: new Date(Date.now() - 60_000) }))
      .returning();
    const res = await book(`seam-user-${runId}-c`, freed.id, 1);
    expect(res.ok).toBe(true);
    const [after] = await testDb
      .select()
      .from(schema.availabilitySlots)
      .where(eq(schema.availabilitySlots.id, freed.id));
    expect(after.bookedCount).toBe(1);
    expect(after.heldUntil).toBeNull();
    expect(after.heldBy).toBeNull();

    const [blocked] = await testDb
      .insert(schema.availabilitySlots)
      .values(futureSlot(1, { until: new Date(Date.now() + 60_000) }))
      .returning();
    const denied = await book(`seam-user-${runId}-d`, blocked.id, 1);
    expect(denied).toEqual({ ok: false, reason: "capacity_exceeded" });
    const [untouched] = await testDb
      .select()
      .from(schema.availabilitySlots)
      .where(eq(schema.availabilitySlots.id, blocked.id));
    expect(untouched.bookedCount).toBe(0);
  });

  it("rejects an over-capacity party and accepts a party within capacity", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const [tight] = await testDb.insert(schema.availabilitySlots).values(futureSlot(2)).returning();
    await expect(book(`seam-user-${runId}-e`, tight.id, 3)).resolves.toEqual({
      ok: false,
      reason: "capacity_exceeded",
    });

    const [roomy] = await testDb.insert(schema.availabilitySlots).values(futureSlot(2)).returning();
    const res = await book(`seam-user-${runId}-f`, roomy.id, 2);
    expect(res.ok).toBe(true);

    await expect(book(`seam-user-${runId}-g`, roomy.id, 5)).resolves.toEqual({
      ok: false,
      reason: "invalid_party",
    });
  });
});
