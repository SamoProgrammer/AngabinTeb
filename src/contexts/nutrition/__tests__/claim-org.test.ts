import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// claimDietProgram calls requireUser — stub the identity module like the
// diet-document tests do. myDietClaims is a pure read (no auth inside).
vi.mock("server-only", () => ({}));
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

// claimDietProgram + myDietClaims read the global `db` (no dbc seam), so
// redirect `@/db` to the disposable database created in beforeAll. Without
// this the test would write to whatever DATABASE_URL points at (production).
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
import { claimDietProgram } from "../actions";
import { myDietClaims } from "../queries";

const mockedRequireUser = vi.mocked(requireUser);

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";
const runId = randomUUID().slice(0, 8);
const dbName = `angabin_claimorg_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const userId = `claimorg-user-${runId}`;
const programId = `claimorg-program-${runId}`;

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
    await testDb.insert(schema.users).values({ id: userId, name: "Claim Org User" });
    await testDb.insert(schema.dietPrograms).values({
      id: programId, name: "برنامه سازمانی", organizationContext: "clinics",
      planType: "کاهش وزن", durationDays: 30, price: "890000",
      description: "claim-org",
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

describe("claim org context + frozen price (disposable database)", () => {
  it("stores organizationContext and freezes pricePaid at the program price", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    mockedRequireUser.mockResolvedValue({ id: userId } as never);
    const input = new FormData();
    input.set("programId", programId);
    input.set("organizationContext", "banks");
    const res = await claimDietProgram(input);
    expect(res.ok).toBe(true);
    if (!res.ok || !("claimId" in res)) throw new Error("expected a claimId");
    const [row] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, res.claimId));
    expect(row.organizationContext).toBe("banks");
    expect(String(row.pricePaid)).toBe("890000");
    expect(row.fulfillmentType).toBe("ai");
  });

  it("rejects a duplicate claim for the same user+program", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    mockedRequireUser.mockResolvedValue({ id: userId } as never);
    const input = new FormData();
    input.set("programId", programId);
    await expect(claimDietProgram(input)).resolves.toEqual({ ok: false, reason: "already_claimed" });
  });

  it("myDietClaims returns the row with hasDocument false", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const rows = await myDietClaims(userId, "fa");
    const row = rows.find((r) => r.programId === programId);
    expect(row).toBeDefined();
    expect(row!.programName).toBe("برنامه سازمانی");
    expect(row!.status).toBe("pending");
    expect(String(row!.pricePaid)).toBe("890000");
    expect(row!.organizationContext).toBe("banks");
    expect(row!.fulfillmentType).toBe("ai");
    expect(row!.hasDocument).toBe(false);
  });
});
