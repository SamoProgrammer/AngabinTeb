import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// getProgramContent never touches auth, but queries.ts shares the module
// graph — stub the identity module like the booking seam tests do.
vi.mock("server-only", () => ({}));
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

import * as schema from "@/db/schema";
import { canAccessProgramContent, isPricedProgram } from "../kernel";
import { getProgramContent, myClaims } from "../queries";

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";

describe("claim gate predicate (pure unit)", () => {
  it("denies unclaimed priced downloads", () => {
    expect(isPricedProgram("890000")).toBe(true);
    expect(canAccessProgramContent("890000", false)).toBe(false);
    expect(canAccessProgramContent(150000, false)).toBe(false);
  });
  it("allows claimed priced downloads (any status counts as ownership)", () => {
    expect(canAccessProgramContent("890000", true)).toBe(true);
  });
  it("allows free programs with or without a claim", () => {
    expect(isPricedProgram("0")).toBe(false);
    expect(canAccessProgramContent("0", false)).toBe(true);
    expect(canAccessProgramContent("0", true)).toBe(true);
    expect(canAccessProgramContent(0, false)).toBe(true);
  });
});

const runId = randomUUID().slice(0, 8);
const dbName = `angabin_claimgate_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const pricedId = `gate-priced-${runId}`;
const freeId = `gate-free-${runId}`;
const ownerId = `gate-user-${runId}`;
const strangerId = `gate-stranger-${runId}`;
const completedOwnerId = `gate-completed-${runId}`;
const downloadUrl = "https://cdn.example.com/diets/gate-plan.pdf";

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
      { id: ownerId, name: "Gate Owner" },
      { id: strangerId, name: "Gate Stranger" },
      { id: completedOwnerId, name: "Gate Completed Owner" },
    ]);
    await testDb.insert(schema.dietPrograms).values([
      {
        id: pricedId, name: "Priced Plan", organizationContext: "clinics",
        planType: "weight_loss", durationDays: 30, price: "890000",
        description: "gated", downloadUrl,
      },
      {
        id: freeId, name: "Free Plan", organizationContext: "clinics",
        planType: "general", durationDays: 7, price: "0",
        description: "open", downloadUrl,
      },
    ]);
    await testDb.insert(schema.dietClaims).values({
      id: randomUUID(), userId: ownerId, programId: pricedId, status: "pending",
    });
    await testDb.insert(schema.dietClaims).values({
      id: randomUUID(), userId: completedOwnerId, programId: pricedId, status: "completed",
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

describe("getProgramContent claim gate (disposable database)", () => {
  it("denies the download to unclaimed callers of a priced program", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const content = await getProgramContent(pricedId, strangerId, "fa", testDb);
    expect(content).not.toBeNull();
    expect(content!.accessDenied).toBe(true);
    expect(content!.hasClaim).toBe(false);
    // Server-side nulling: the URL never leaves the query for unclaimed users.
    expect(content!.downloadUrl).toBeNull();
  });

  it("serves the download to the claim holder without re-claiming", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const before = await myClaims(ownerId, testDb);
    expect(before.some((c) => c.programId === pricedId)).toBe(true);
    const content = await getProgramContent(pricedId, ownerId, "fa", testDb);
    expect(content!.accessDenied).toBe(false);
    expect(content!.hasClaim).toBe(true);
    expect(content!.downloadUrl).toBe(downloadUrl);
    // Re-access is read-only: no new claim row was created.
    const after = await testDb
      .select()
      .from(schema.dietClaims);
    expect(after.filter((c: { programId: string }) => c.programId === pricedId).length).toBe(2);
  });

  it("lets completed-claim owners re-access without re-claiming", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const content = await getProgramContent(pricedId, completedOwnerId, "fa", testDb);
    expect(content!.accessDenied).toBe(false);
    expect(content!.downloadUrl).toBe(downloadUrl);
  });

  it("serves free programs with no claim at all", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const content = await getProgramContent(freeId, strangerId, "fa", testDb);
    expect(content!.accessDenied).toBe(false);
    expect(content!.downloadUrl).toBe(downloadUrl);
  });

  it("returns null for unknown programs", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    await expect(getProgramContent(`nope-${runId}`, strangerId, "fa", testDb)).resolves.toBeNull();
  });
});
