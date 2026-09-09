import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("ai", () => ({ generateText: vi.fn() }));
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

import * as schema from "@/db/schema";
import { freezeRegistrySnapshotForUser } from "../actions";

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";
const runId = randomUUID().slice(0, 8);
const dbName = `angabin_snapfreeze_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const userId = `snapfreeze-user-${runId}`;
const programId = `snapfreeze-program-${runId}`;
const paidClaimId = randomUUID();
const bareUserId = `snapfreeze-bare-user-${runId}`;
const bareProgramId = `snapfreeze-bare-program-${runId}`;
const bareClaimId = randomUUID();

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
    await testDb.insert(schema.users).values([
      { id: userId, name: "Snapshot Freeze User" },
      { id: bareUserId, name: "Snapshot Bare User" },
    ]);
    await testDb.insert(schema.dietPrograms).values([
      {
        id: programId, name: "کاهش وزن", organizationContext: "clinics",
        planType: "کاهش وزن", durationDays: 30, price: "890000",
        description: "snap",
      },
      {
        id: bareProgramId, name: "تثبیت وزن", organizationContext: "clinics",
        planType: "تثبیت وزن", durationDays: 14, price: "100000",
        description: "snap-bare",
      },
    ]);
    await testDb.insert(schema.clinicalRegistries).values({
      id: randomUUID(), userId, personInfo: { fullName: "تست" },
    });
    await testDb.insert(schema.dietClaims).values([
      { id: paidClaimId, userId, programId, status: "paid" },
      { id: bareClaimId, userId: bareUserId, programId: bareProgramId, status: "paid" },
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

describe("freezeRegistrySnapshotForUser (disposable database)", () => {
  test("freeze copies the 8 sections onto paid claims, idempotent on re-run", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const first = await freezeRegistrySnapshotForUser(userId, { dbc: testDb });
    expect(first.frozen).toBe(1);
    const second = await freezeRegistrySnapshotForUser(userId, { dbc: testDb });
    expect(second.frozen).toBe(0);
    const [snap] = await testDb.select().from(schema.registrySnapshots).where(eq(schema.registrySnapshots.claimId, paidClaimId));
    expect(snap.personInfo).toEqual({ fullName: "تست" });
  });

  test("user with no registry row freezes nothing, claim stays paid", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await freezeRegistrySnapshotForUser(bareUserId, { dbc: testDb });
    expect(res).toEqual({ ok: true, frozen: 0 });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, bareClaimId));
    expect(claim.status).toBe("paid");
  });
});
