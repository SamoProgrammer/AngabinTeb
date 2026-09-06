import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Same stub as booking-seam.test.ts: the seam under test never calls
// requireUser, so avoid booting the Next auth stack inside vitest.
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

import * as schema from "@/db/schema";
import { resetRateLimit } from "@/lib/rate-limit";
import { bookAppointmentWithUser } from "../actions";

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";

const runId = randomUUID().slice(0, 8);
const dbName = `angabin_patient_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const providerId = `patient-prov-${runId}`;
const categoryId = `patient-cat-${runId}`;
const serviceId = `patient-svc-${runId}`;
const userId = `patient-user-${runId}`;
const slotId = `patient-slot-${runId}`;
const slotId2 = `patient-slot-2-${runId}`;

beforeAll(async () => {
  try {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      console.warn(SKIP + " (DATABASE_URL is not set)");
      return;
    }
    const testUrl = baseUrl.replace(/\/[^/?]*(\?|$)/, `/${dbName}$1`);
    admin = postgres(baseUrl, { max: 1 });
    await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    testClient = postgres(testUrl, { max: 5 });
    testDb = drizzle(testClient, { schema });
    await migrate(testDb, {
      migrationsFolder: fileURLToPath(new URL("../../../db/migrations", import.meta.url)),
    });
    await testDb.insert(schema.providers).values({ id: providerId, kind: "person", name: "Patient Doctor" });
    await testDb
      .insert(schema.serviceCategories)
      .values({ id: categoryId, slug: `patient-cat-${runId}`, name: "Patient Category" });
    await testDb.insert(schema.services).values({
      id: serviceId,
      providerId,
      categoryId,
      serviceType: "consultation",
      name: "Patient Service",
      durationMinutes: 30,
      basePrice: "0",
    });
    await testDb.insert(schema.users).values({ id: userId, name: "Patient User" });
    const startsAt = new Date(Date.now() + 24 * 3_600_000);
    await testDb.insert(schema.availabilitySlots).values([
      {
        id: slotId,
        providerId,
        serviceId,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60_000),
        capacity: 5,
      },
      {
        id: slotId2,
        providerId,
        serviceId,
        startsAt: new Date(startsAt.getTime() + 60 * 60_000),
        endsAt: new Date(startsAt.getTime() + 90 * 60_000),
        capacity: 5,
      },
    ]);
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

describe("booking patient fields (disposable database)", () => {
  it("persists patient name/phone as columns and keeps notes separate", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await bookAppointmentWithUser(
      { id: userId },
      {
        serviceId,
        slotId,
        partySize: 1,
        patientName: "سارا محمدی",
        patientPhone: "+989123456789",
        notes: "headache",
        idempotencyKey: randomUUID(),
      },
      testDb,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const [row] = await testDb
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.id, res.appointmentId));
    expect(row.patientName).toBe("سارا محمدی");
    expect(row.patientPhone).toBe("+989123456789");
    expect(row.notes).toBe("headache");
  });

  it("omitted patient fields store as null", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await bookAppointmentWithUser(
      { id: userId },
      { serviceId, slotId: slotId2, partySize: 1, idempotencyKey: randomUUID() },
      testDb,
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const [row] = await testDb
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.id, res.appointmentId));
    expect(row.patientName).toBeNull();
    expect(row.patientPhone).toBeNull();
  });

  it("rejects an over-long name and a malformed phone", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    await expect(
      bookAppointmentWithUser(
        { id: userId },
        { serviceId, slotId, partySize: 1, patientName: "x".repeat(121), idempotencyKey: randomUUID() },
        testDb,
      ),
    ).rejects.toThrow();
    await expect(
      bookAppointmentWithUser(
        { id: userId },
        { serviceId, slotId, partySize: 1, patientPhone: "not-a-phone!!", idempotencyKey: randomUUID() },
        testDb,
      ),
    ).rejects.toThrow();
  });
});
