import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Never hit the network: the AI generator is mocked at the `ai` boundary.
// The key-missing guard is tested by deleting AI_API_KEY (restored after).
vi.mock("server-only", () => ({}));
vi.mock("ai", () => ({ generateText: vi.fn() }));
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));

import { generateText } from "ai";
import { requireUser } from "@/contexts/identity/actions";
import * as schema from "@/db/schema";
import { buildDietPrompt, DIET_DOC_FOOTER } from "@/lib/ai-diet";
import { generateProgramDocument } from "../actions";

const mockedGenerateText = vi.mocked(generateText);
const mockedRequireUser = vi.mocked(requireUser);

describe("diet prompt", () => {
  it("embeds physiology + program type + registry note", () => {
    const p = buildDietPrompt({ sex: "female", age: 40, weightKg: 80, heightCm: 165, activityLevel: "light", programType: "کاهش وزن", registrySummary: "دیابت نوع ۲" });
    expect(p).toContain("کاهش وزن");
    expect(p).toContain("دیابت نوع ۲");
    expect(p).toContain("80");
  });

  it("mentions Persian portion units and day-by-day detail", () => {
    const p = buildDietPrompt({ sex: "male", age: 30, weightKg: 70, heightCm: 178, activityLevel: "moderate", programType: "تثبیت وزن", registrySummary: "" });
    expect(p).toContain("کف دست");
    expect(p).toContain("روز");
  });
});

describe("generateDietPlan key guard (mocked generator)", () => {
  it("throws a clear error without calling the model when no key is present", async () => {
    const { generateDietPlan } = await import("@/lib/ai-diet");
    const saved = process.env.AI_API_KEY;
    delete process.env.AI_API_KEY;
    mockedGenerateText.mockReset();
    try {
      await expect(generateDietPlan("prompt-mتن")).rejects.toThrow(/AI_API_KEY/);
      expect(mockedGenerateText).not.toHaveBeenCalled();
    } finally {
      if (saved !== undefined) process.env.AI_API_KEY = saved;
    }
  });
});

describe("generateDietPlan provider paths (mocked generator)", () => {
  it("uses the OpenAI-compatible provider (object model) when AI_BASE_URL is set", async () => {
    const { generateDietPlan } = await import("@/lib/ai-diet");
    const savedKey = process.env.AI_API_KEY;
    const savedBase = process.env.AI_BASE_URL;
    const savedGateway = process.env.AI_GATEWAY_API_KEY;
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "http://127.0.0.1:1/v1";
    delete process.env.AI_GATEWAY_API_KEY;
    mockedGenerateText.mockReset();
    mockedGenerateText.mockResolvedValue({ text: "ok" } as never);
    try {
      await expect(generateDietPlan("prompt")).resolves.toBe("ok");
      expect(mockedGenerateText).toHaveBeenCalledTimes(1);
      const model = mockedGenerateText.mock.calls[0][0].model;
      expect(typeof model).toBe("object");
    } finally {
      if (savedKey !== undefined) process.env.AI_API_KEY = savedKey;
      else delete process.env.AI_API_KEY;
      if (savedBase !== undefined) process.env.AI_BASE_URL = savedBase;
      else delete process.env.AI_BASE_URL;
      if (savedGateway !== undefined) process.env.AI_GATEWAY_API_KEY = savedGateway;
      else delete process.env.AI_GATEWAY_API_KEY;
    }
  });
});
describe("generateProgramDocument idempotent retry (no DB, mocked dbc)", () => {
  it("returns ready without calling the model when a document already exists", async () => {
    const claimId = randomUUID();
    const updates: Array<{ table: unknown; set: unknown }> = [];
    let transactionCalled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeDbc: any = {
      select: () => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from: (t: any) => ({
          where: async () => {
            if (t === schema.dietClaims) {
              return [{ id: claimId, programId: "p1", status: "generating" }];
            }
            if (t === schema.dietDocuments) {
              return [{ id: "doc-1" }];
            }
            return [];
          },
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: (t: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set: (v: any) => ({
          where: async () => {
            updates.push({ table: t, set: v });
            return [];
          },
        }),
      }),
      transaction: async () => {
        transactionCalled = true;
        throw new Error("should not reach transaction on early return");
      },
    };
    mockedRequireUser.mockResolvedValue({ id: "user-1" } as never);
    mockedGenerateText.mockClear();
    const res = await generateProgramDocument(claimId, { dbc: fakeDbc });
    expect(res.ok).toBe(true);
    expect(mockedGenerateText).not.toHaveBeenCalled();
    expect(transactionCalled).toBe(false);
    expect(updates.some((u) => u.table === schema.dietClaims)).toBe(true);
  });
});

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";
const runId = randomUUID().slice(0, 8);
const dbName = `angabin_dietdoc_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const userId = `dietdoc-user-${runId}`;
const programId = `dietdoc-program-${runId}`;
const paidClaimId = randomUUID();
const failingClaimId = randomUUID();

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
    await testDb.insert(schema.users).values({ id: userId, name: "Diet Doc User" });
    await testDb.insert(schema.dietPrograms).values([
      {
        id: programId, name: "کاهش وزن", organizationContext: "clinics",
        planType: "کاهش وزن", durationDays: 30, price: "890000",
        description: "doc",
      },
      {
        id: `${programId}-x`, name: "تثبیت وزن", organizationContext: "clinics",
        planType: "تثبیت وزن", durationDays: 14, price: "100000",
        description: "doc-x",
      },
    ]);
    await testDb.insert(schema.dietClaims).values([
      { id: paidClaimId, userId, programId, status: "paid" },
      { id: failingClaimId, userId, programId: `${programId}-x`, status: "paid" },
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

describe("generateProgramDocument transitions (disposable database, mocked generator)", () => {
  it("paid → generating → ready with stored document + footer", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    process.env.AI_API_KEY = process.env.AI_API_KEY ?? "test-key";
    mockedRequireUser.mockResolvedValue({ id: userId } as never);
    mockedGenerateText.mockResolvedValue({ text: "برنامه روز اول: صبحانه …" } as never);
    const res = await generateProgramDocument(paidClaimId, { dbc: testDb });
    expect(res.ok).toBe(true);
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, paidClaimId));
    expect(claim.status).toBe("ready");
    const rows = await testDb.select().from(schema.dietDocuments);
    expect(rows.length).toBe(1);
    expect(rows[0].claimId).toBe(paidClaimId);
    expect(rows[0].bodyMarkdown).toContain("برنامه روز اول");
    expect(rows[0].bodyMarkdown).toContain(DIET_DOC_FOOTER);
  });

  it("leaves the claim generating (retryable) when the generator throws", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    process.env.AI_API_KEY = process.env.AI_API_KEY ?? "test-key";
    mockedRequireUser.mockResolvedValue({ id: userId } as never);
    mockedGenerateText.mockRejectedValueOnce(new Error("model down"));
    const res = await generateProgramDocument(failingClaimId, { dbc: testDb });
    expect(res.ok).toBe(false);
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, failingClaimId));
    expect(claim.status).toBe("generating");
    const docs = await testDb.select().from(schema.dietDocuments);
    expect(docs.every((d: { claimId: string }) => d.claimId !== failingClaimId)).toBe(true);
  });
});
