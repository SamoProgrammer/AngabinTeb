import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// logWeight calls requireUser — stub the identity module like the
// diet-document tests do. weightHistory is a pure query (no auth inside).
vi.mock("server-only", () => ({}));
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

// logWeight + weightHistory read the global `db` (no dbc seam), so redirect
// `@/db` to the disposable database created in beforeAll — same pattern as
// claim-org.test.ts. Without this the test would write to whatever
// DATABASE_URL points at (production).
// ponytail: getter mock, add a dbc param to both functions if this gets fragile
const testDbHolder: { current: unknown } = { current: null };
vi.mock("@/db", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/db")>();
  return {
    ...mod,
    get db() {
      return testDbHolder.current ?? mod.db;
    },
  };
});

import { requireUser } from "@/contexts/identity/actions";
import * as schema from "@/db/schema";
import { logWeight } from "../actions";
import { weightHistory } from "../queries";

const mockedRequireUser = vi.mocked(requireUser);

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";
const runId = randomUUID().slice(0, 8);
const dbName = `angabin_weightlog_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const userId = `weightlog-user-${runId}`;

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
    testDbHolder.current = testDb;
    await admin.unsafe(`CREATE DATABASE "${dbName}"`);
    await migrate(testDb, {
      migrationsFolder: fileURLToPath(new URL("../../../db/migrations", import.meta.url)),
    });
    await testDb.insert(schema.users).values({ id: userId, name: "Weight Log User" });
    await testDb.insert(schema.physiologyProfiles).values({
      userId, sex: "male", birthDate: "1990-01-01",
      heightCm: "178", weightKg: "80", activityLevel: "moderate",
    });
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

describe("weight log wiring (disposable database)", () => {
  it("returns out-of-order logs ascending by loggedAt and syncs physiology to the latest logged weight", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    mockedRequireUser.mockResolvedValue({ id: userId } as never);
    // Logged out of order; the last call is also the latest date so both
    // readings of "latest" agree.
    expect((await logWeight({ weightKg: 80, loggedAt: "2026-09-02" })).ok).toBe(true);
    expect((await logWeight({ weightKg: 82, loggedAt: "2026-09-01" })).ok).toBe(true);
    expect((await logWeight({ weightKg: 81, loggedAt: "2026-09-03" })).ok).toBe(true);
    const rows = await weightHistory(userId);
    expect(rows.map((r: { loggedAt: string }) => r.loggedAt)).toEqual([
      "2026-09-01", "2026-09-02", "2026-09-03",
    ]);
    expect(rows.map((r: { weightKg: string }) => Number(r.weightKg))).toEqual([82, 80, 81]);
    const [profile] = await testDb.select().from(schema.physiologyProfiles).where(eq(schema.physiologyProfiles.userId, userId));
    expect(Number(profile.weightKg)).toBe(81);
  });

  it("rejects an out-of-range weight without inserting a row", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    mockedRequireUser.mockResolvedValue({ id: userId } as never);
    const before = await testDb.select().from(schema.weightLogs).where(eq(schema.weightLogs.userId, userId));
    const res = await logWeight({ weightKg: 400, loggedAt: "2026-09-04" });
    expect(res.ok).toBe(false);
    const after = await testDb.select().from(schema.weightLogs).where(eq(schema.weightLogs.userId, userId));
    expect(after.length).toBe(before.length);
  });
});
