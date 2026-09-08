import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { renderToReadableStream } from "react-dom/server";
import { formatPersianNumber } from "@/lib/metabolism";
import CalorieListPage from "../calorie/page";
import CalorieDetailPage from "../calorie/[id]/page";

vi.mock("server-only", () => ({}));

vi.mock("next-intl/server", () => ({
  getTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/fa/nutrition/calorie/p1",
  notFound: () => {
    throw new Error("notFound");
  },
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn(async () => ({ id: "u1" })),
}));

vi.mock("@/contexts/nutrition/queries", () => ({
  listPeriods: vi.fn(),
  getPeriod: vi.fn(),
  periodEntries: vi.fn(),
  periodTotals: vi.fn(),
  getPhysiology: vi.fn(),
  foodPickerOptions: vi.fn(),
}));

vi.mock("@/contexts/nutrition/actions", () => ({
  createPeriod: vi.fn(),
  deleteIntake: vi.fn(),
  logIntake: vi.fn(async () => ({ ok: true as const })),
}));

import {
  listPeriods,
  getPeriod,
  periodEntries,
  periodTotals,
  getPhysiology,
  foodPickerOptions,
} from "@/contexts/nutrition/queries";

const mockListPeriods = vi.mocked(listPeriods);
const mockGetPeriod = vi.mocked(getPeriod);
const mockPeriodEntries = vi.mocked(periodEntries);
const mockPeriodTotals = vi.mocked(periodTotals);
const mockGetPhysiology = vi.mocked(getPhysiology);
const mockFoodPickerOptions = vi.mocked(foodPickerOptions);

async function renderHTML(el: ReactElement) {
  const stream = await renderToReadableStream(el);
  await stream.allReady;
  return new Response(stream).text();
}

const profile = {
  sex: "male",
  age: 30,
  weightKg: "70",
  heightCm: "175",
  activityLevel: "moderate",
  bmr: 1650,
  tdee: 2200,
};

const faParams = Promise.resolve({ locale: "fa" });

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPhysiology.mockResolvedValue(profile as never);
  mockFoodPickerOptions.mockResolvedValue([
    { id: "f1", name: "نان", servingUnits: [{ id: "s1", name: "کف دست" }] },
  ]);
});

describe("CalorieListPage", () => {
  it("renders CTA + period cards when periods exist", async () => {
    mockListPeriods.mockResolvedValue([
      { id: "p1", title: "هفته ۱", startsOn: "2026-09-01", endsOn: "2026-09-07" },
    ] as never);
    mockPeriodEntries.mockResolvedValue([{}, {}] as never);
    const html = await renderHTML(
      await CalorieListPage({ params: faParams, searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("nutrition.calorieNewCta");
    expect(html).toContain('href="#new"');
    expect(html).toContain("هفته ۱");
    expect(html).toContain("/fa/nutrition/calorie/p1");
  });

  it("renders one-sentence empty state + CTA when no periods", async () => {
    mockListPeriods.mockResolvedValue([]);
    const html = await renderHTML(
      await CalorieListPage({ params: faParams, searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("nutrition.calorieEmpty");
    expect(html).toContain("nutrition.calorieNewCta");
  });

  it("shows inline error for a failed create redirect code", async () => {
    mockListPeriods.mockResolvedValue([]);
    const html = await renderHTML(
      await CalorieListPage({
        params: faParams,
        searchParams: Promise.resolve({ error: "end before start" }),
      }),
    );
    expect(html).toContain("nutrition.calorieErrOrder");
  });
});

describe("CalorieDetailPage", () => {
  const period = {
    id: "p1",
    title: "هفته ۱",
    startsOn: "2026-09-01",
    endsOn: "2026-09-07",
    sex: "male",
    age: 30,
    weightKg: "70",
    heightCm: "175",
    activityLevel: "moderate",
  };
  const entry = {
    id: "e1",
    foodName: "نان",
    servingUnitName: "کف دست",
    quantity: "2",
    mealSlot: "breakfast",
    loggedAt: new Date("2026-09-02T08:00:00Z"),
    gramsEquivalent: "30",
    foodId: "f1",
  };

  it("prompts for محاسبه when calc is absent", async () => {
    mockGetPeriod.mockResolvedValue(period as never);
    mockPeriodEntries.mockResolvedValue([entry] as never);
    const html = await renderHTML(
      await CalorieDetailPage({
        params: Promise.resolve({ locale: "fa", id: "p1" }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(html).toContain("nutrition.calorieCalcHint");
    expect(html).toContain("?calc=1");
    expect(mockPeriodTotals).not.toHaveBeenCalled();
  });

  it("shows BMR number when calc=1", async () => {
    mockGetPeriod.mockResolvedValue(period as never);
    mockPeriodEntries.mockResolvedValue([entry] as never);
    mockPeriodTotals.mockResolvedValue({
      totals: { "n-energy": 500, "n-protein": 30, "n-carbs": 60, "n-fat": 10 },
      bmr: 1650,
      tdee: 2200,
      macros: { proteinGrams: 137.5, carbGrams: 275, fatGrams: 61.1 },
      entryCount: 1,
    });
    const html = await renderHTML(
      await CalorieDetailPage({
        params: Promise.resolve({ locale: "fa", id: "p1" }),
        searchParams: Promise.resolve({ calc: "1" }),
      }),
    );
    expect(html).toContain(formatPersianNumber(1650));
    expect(html).toContain("nutrition.calorieSlotBreakfast");
  });

  it("404s on unknown period", async () => {
    mockGetPeriod.mockResolvedValue(null as never);
    await expect(
      CalorieDetailPage({
        params: Promise.resolve({ locale: "fa", id: "nope" }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow("notFound");
  });
});

import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

function proxyReq(path: string) {
  return new NextRequest(new URL(`http://localhost${path}`));
}

describe("proxy nutrition redirects + calorie rewrite", () => {
  it("307s /fa/nutrition/diary to /fa/nutrition/calorie, preserving search", () => {
    const res = proxy(proxyReq("/fa/nutrition/diary?x=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/fa/nutrition/calorie?x=1",
    );
  });

  it("307s /fa/nutrition/nutrition to /fa/nutrition/calorie", () => {
    const res = proxy(proxyReq("/fa/nutrition/nutrition"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/fa/nutrition/calorie");
  });

  it("307s /fa/food-analysis/* to /fa/nutrition/calorie", () => {
    const res = proxy(proxyReq("/fa/food-analysis/personal"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/fa/nutrition/calorie");
  });

  it("307s /fa/booking/offline-diet to /fa/nutrition/diet", () => {
    const res = proxy(proxyReq("/fa/booking/offline-diet/types"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/fa/nutrition/diet");
  });

  it("307s /fa/foods/meal-type/* to /fa/foods", () => {
    const res = proxy(proxyReq("/fa/foods/meal-type/breakfast"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/fa/foods");
  });

  it("rewrites /fa/nutrition/calorie/* to the real segment", () => {
    const res = proxy(proxyReq("/fa/nutrition/calorie/p1"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/fa/calorie/p1");
  });
});
