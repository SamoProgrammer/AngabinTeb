import "dotenv/config";
import { randomUUID } from "crypto";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Never hit the network: the AI generator is mocked at the `ai` boundary.
// Never touch the real database: `@/db` is mocked to the disposable database
// holder (filled in beforeAll), so the real client is never even constructed.
vi.mock("server-only", () => ({}));
vi.mock("ai", () => ({ generateText: vi.fn() }));
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(),
  requireAdmin: vi.fn(),
}));
const dbHolder = vi.hoisted(() => ({ db: null as unknown }));
vi.mock("@/db", () => ({
  get db() {
    return (dbHolder as { db: unknown }).db;
  },
}));

import { generateText } from "ai";
import { requireAdmin, requireUser } from "@/contexts/identity/actions";
import * as schema from "@/db/schema";
import {
  approveClaim,
  cancelClaim,
  generateProgramDocument,
  requestClaimChanges,
  retryClaimGeneration,
  saveDocumentBody,
} from "../actions";

const mockedGenerateText = vi.mocked(generateText);
const mockedRequireAdmin = vi.mocked(requireAdmin);
const mockedRequireUser = vi.mocked(requireUser);
mockedRequireAdmin.mockResolvedValue({ id: "admin-1", role: "admin" } as never);

const SKIP = "SKIP: disposable test database unreachable — set DATABASE_URL to run this DB-backed test";
const runId = randomUUID().slice(0, 8);
const dbName = `angabin_claimadm_${runId}`.replace(/-/g, "_");

let admin: postgres.Sql | null = null;
let testClient: postgres.Sql | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let testDb: any = null;
let ready = false;

const userId = `claimadm-user-${runId}`;
const programBase = `claimadm-program-${runId}`;
const reviewClaimId = randomUUID();
const paidClaimId = randomUUID();
const failedClaimId = randomUUID();
const readyClaimId = randomUUID();
const changesClaimId = randomUUID();
const cancelClaimId = randomUUID();
const retryReviewClaimId = randomUUID();
const blankNoteClaimId = randomUUID();
const blankBodyClaimId = randomUUID();

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
    (dbHolder as { db: unknown }).db = testDb;
    await testDb.insert(schema.users).values({ id: userId, name: "Claim Admin User" });
    // One program per claim: the one_claim_per_program partial unique index
    // (user, program) where status != 'completed' forbids sharing.
    const programs = ["review", "paid", "failed", "ready", "changes", "cancel", "retry-review", "blank-note", "blank-body"].map((k) => ({
      id: `${programBase}-${k}`,
      name: `برنامه ${k}`,
      organizationContext: "clinics",
      planType: "کاهش وزن",
      durationDays: 30,
      price: "890000",
      description: "claim-admin",
    }));
    await testDb.insert(schema.dietPrograms).values(programs);
    await testDb.insert(schema.dietClaims).values([
      { id: reviewClaimId, userId, programId: `${programBase}-review`, status: "needs_review" },
      { id: paidClaimId, userId, programId: `${programBase}-paid`, status: "paid" },
      { id: failedClaimId, userId, programId: `${programBase}-failed`, status: "failed", retryCount: 2 },
      { id: readyClaimId, userId, programId: `${programBase}-ready`, status: "ready" },
      { id: changesClaimId, userId, programId: `${programBase}-changes`, status: "needs_review" },
      { id: cancelClaimId, userId, programId: `${programBase}-cancel`, status: "paid" },
      { id: retryReviewClaimId, userId, programId: `${programBase}-retry-review`, status: "needs_review" },
      { id: blankNoteClaimId, userId, programId: `${programBase}-blank-note`, status: "needs_review" },
      { id: blankBodyClaimId, userId, programId: `${programBase}-blank-body`, status: "needs_review" },
    ]);
    await testDb.insert(schema.dietDocuments).values([
      { id: randomUUID(), claimId: retryReviewClaimId, model: "test-model", promptVersion: "v1", bodyMarkdown: "سند بازبینی‌شده" },
      { id: randomUUID(), claimId: blankBodyClaimId, model: "test-model", promptVersion: "v1", bodyMarkdown: "سند بازبینی‌شده" },
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

describe("claim admin actions (disposable database)", () => {
  it("approve flips needs_review → ready", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await approveClaim(reviewClaimId);
    expect(res).toEqual({ ok: true });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, reviewClaimId));
    expect(claim.status).toBe("ready");
  });

  it("approve on paid → invalid_status, claim untouched", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await approveClaim(paidClaimId);
    expect(res.ok).toBe(false);
    expect(res).toEqual({ ok: false, reason: "invalid_status" });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, paidClaimId));
    expect(claim.status).toBe("paid");
  });

  it("retry resets the counter and lands needs_review on mocked AI success", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    process.env.AI_API_KEY = process.env.AI_API_KEY ?? "test-key";
    mockedGenerateText.mockReset();
    mockedGenerateText.mockResolvedValue({ text: "برنامه روز اول: صبحانه …" } as never);
    // Admin session driving another user's claim: exercises the foreign-ownerId
    // path (requireAdmin re-verified inside generateProgramDocument).
    mockedRequireUser.mockResolvedValue({ id: "admin-1", role: "admin" } as never);
    const res = await retryClaimGeneration(failedClaimId);
    expect(res).toEqual({ ok: true });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, failedClaimId));
    expect(claim.status).toBe("needs_review");
    expect(claim.retryCount).toBe(0);
    const docs = await testDb.select().from(schema.dietDocuments).where(eq(schema.dietDocuments.claimId, failedClaimId));
    expect(docs.length).toBe(1);
  });

  it("saveDocumentBody on ready → rejected, nothing written", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await saveDocumentBody(readyClaimId, "# ویرایش مدیر");
    expect(res).toEqual({ ok: false, reason: "invalid_status" });
    const docs = await testDb.select().from(schema.dietDocuments).where(eq(schema.dietDocuments.claimId, readyClaimId));
    expect(docs.length).toBe(0);
  });

  it("requestClaimChanges flips to generating + files a support ticket with the claimId", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await requestClaimChanges(changesClaimId, "لطفاً وزن جدید را ثبت کنید");
    expect(res).toEqual({ ok: true });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, changesClaimId));
    expect(claim.status).toBe("generating");
    const tickets = await testDb.select().from(schema.supportRequests).where(eq(schema.supportRequests.userId, userId));
    expect(tickets.length).toBe(1);
    expect(tickets[0].body).toContain(changesClaimId);
    expect(tickets[0].body).toContain("لطفاً وزن جدید را ثبت کنید");
  });

  it("cancelClaim flips paid → completed (record only)", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await cancelClaim(cancelClaimId);
    expect(res).toEqual({ ok: true });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, cancelClaimId));
    expect(claim.status).toBe("completed");
  });

  it("retry on needs_review → invalid_status, status and document untouched", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await retryClaimGeneration(retryReviewClaimId);
    expect(res).toEqual({ ok: false, reason: "invalid_status" });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, retryReviewClaimId));
    expect(claim.status).toBe("needs_review");
    const docs = await testDb.select().from(schema.dietDocuments).where(eq(schema.dietDocuments.claimId, retryReviewClaimId));
    expect(docs.length).toBe(1);
    expect(docs[0].bodyMarkdown).toBe("سند بازبینی‌شده");
  });

  it("requestClaimChanges with blank note → invalid_input, nothing written", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await requestClaimChanges(blankNoteClaimId, "   ");
    expect(res).toEqual({ ok: false, reason: "invalid_input" });
    const [claim] = await testDb.select().from(schema.dietClaims).where(eq(schema.dietClaims.id, blankNoteClaimId));
    expect(claim.status).toBe("needs_review");
    const tickets = await testDb.select().from(schema.supportRequests).where(eq(schema.supportRequests.userId, userId));
    expect(tickets.every((t: { body: string }) => !t.body.includes(blankNoteClaimId))).toBe(true);
  });

  it("saveDocumentBody with blank markdown → invalid_input, document untouched", async (ctx) => {
    if (!ready) {
      ctx.skip();
      return;
    }
    const res = await saveDocumentBody(blankBodyClaimId, "  \n ");
    expect(res).toEqual({ ok: false, reason: "invalid_input" });
    const [doc] = await testDb.select().from(schema.dietDocuments).where(eq(schema.dietDocuments.claimId, blankBodyClaimId));
    expect(doc.bodyMarkdown).toBe("سند بازبینی‌شده");
  });
});

// No-DB unit coverage for the review fixes: `@/db` is module-mocked, so
// swapping the holder for a throwing/recording fake proves the guards fire
// before any database access. These run even when the disposable DB skips.
function withFakeDb(fake: unknown) {
  const holder = dbHolder as { db: unknown };
  const prev = holder.db;
  holder.db = fake;
  return () => {
    holder.db = prev;
  };
}

describe("retry guard (no DB)", () => {
  it("rejects retry on needs_review without writing", async () => {
    const writes: string[] = [];
    const restore = withFakeDb({      select: () => ({
        from: () => ({
          where: async () => [{ id: "c1", userId: "u1", status: "needs_review" }],
        }),
      }),
      update: () => {
        writes.push("update");
        return { set: () => ({ where: async () => [] }) };
      },
    });
    try {
      mockedGenerateText.mockClear();
      const res = await retryClaimGeneration("c1");
      expect(res).toEqual({ ok: false, reason: "invalid_status" });
      expect(writes).toEqual([]);
      expect(mockedGenerateText).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });
});

describe("blank input guards (no DB)", () => {
  it("rejects blank note / blank markdown before any DB access", async () => {
    const restore = withFakeDb({
      select: () => {
        throw new Error("DB read on invalid input");
      },
      update: () => {
        throw new Error("DB write on invalid input");
      },
      insert: () => {
        throw new Error("DB write on invalid input");
      },
    });
    try {
      expect(await requestClaimChanges("c1", "   ")).toEqual({ ok: false, reason: "invalid_input" });
      expect(await saveDocumentBody("c1", "  \n ")).toEqual({ ok: false, reason: "invalid_input" });
    } finally {
      restore();
    }
  });
});

describe("ownerId enforcement (no DB, mocked dbc)", () => {
  it("rejects a non-admin caller passing a foreign ownerId without touching the DB", async () => {
    let touched = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeDbc: any = {
      select: () => {
        touched = true;
        return { from: () => ({ where: async () => [] }) };
      },
      update: () => {
        touched = true;
        return { set: () => ({ where: async () => [] }) };
      },
    };
    mockedRequireUser.mockResolvedValue({ id: "caller-1" } as never);
    mockedRequireAdmin.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));
    await expect(
      generateProgramDocument("claim-1", { dbc: fakeDbc, ownerId: "patient-9" }),
    ).rejects.toThrow();
    expect(touched).toBe(false);
  });

  it("lets an admin through with a foreign ownerId (existing doc → ok)", async () => {
    const adminCalls = mockedRequireAdmin.mock.calls.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeDbc: any = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: () => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from: (t: any) => ({
          where: async () => {
            if (t === schema.dietClaims) {
              return [{ id: "claim-1", programId: "p1", status: "paid", retryCount: 0 }];
            }
            if (t === schema.dietDocuments) {
              return [{ id: "doc-1" }];
            }
            return [];
          },
        }),
      }),
    };
    mockedRequireUser.mockResolvedValue({ id: "admin-1" } as never);
    const res = await generateProgramDocument("claim-1", { dbc: fakeDbc, ownerId: "patient-9" });
    expect(res).toEqual({ ok: true });
    expect(mockedRequireAdmin.mock.calls.length).toBe(adminCalls + 1);
  });

  it("skips the admin check when ownerId equals the session user", async () => {
    const adminCalls = mockedRequireAdmin.mock.calls.length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeDbc: any = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      select: () => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        from: (t: any) => ({
          where: async () => {
            if (t === schema.dietClaims) {
              return [{ id: "claim-1", programId: "p1", status: "paid", retryCount: 0 }];
            }
            if (t === schema.dietDocuments) {
              return [{ id: "doc-1" }];
            }
            return [];
          },
        }),
      }),
    };
    mockedRequireUser.mockResolvedValue({ id: "patient-9" } as never);
    const res = await generateProgramDocument("claim-1", { dbc: fakeDbc, ownerId: "patient-9" });
    expect(res).toEqual({ ok: true });
    expect(mockedRequireAdmin.mock.calls.length).toBe(adminCalls);
  });
});
