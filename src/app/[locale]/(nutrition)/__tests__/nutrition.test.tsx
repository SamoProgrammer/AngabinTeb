import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";

import NutritionLayout from "../layout";
import NutritionHomePage from "../page";
import BodyPage from "../body/page";
import DiaryPage from "../diary/page";
import DietPage from "../diet/page";
import FoodsPage from "../foods/page";
import FoodDetailPage from "../foods/[id]/page";
import { LogFood } from "@/components/nutrition/log-food";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/fa/nutrition",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// Mock Identity
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: "usr-clinical-1",
    name: "سارا محمدی‌تبار",
    phone: "09123456789",
    role: "patient",
  }),
}));

// Mock Nutrition queries
vi.mock("@/contexts/nutrition/queries", () => ({
  getPhysiology: vi.fn().mockResolvedValue({
    userId: "usr-clinical-1",
    sex: "male",
    birthDate: "1992-05-15",
    heightCm: "175",
    weightKg: "69",
    activityLevel: "moderate",
    age: 32,
    bmr: 1618,
    tdee: 2508,
  }),
  dayIntake: vi.fn().mockResolvedValue({
    intakes: [
      {
        id: "intake-1",
        foodId: "f-ash",
        foodName: "آش رشته",
        servingUnitName: "بشقاب",
        quantity: "1",
        loggedAt: new Date("2026-09-04T12:00:00Z"),
      },
    ],
    totals: {
      "n-energy": 276,
      "n-carbs": 42,
      "n-protein": 14,
      "n-fat": 6,
    },
  }),
  foodPickerOptions: vi.fn().mockResolvedValue([
    {
      id: "f-ash",
      name: "آش رشته",
      servingUnits: [
        { id: "su-plate", name: "بشقاب" },
        { id: "su-bowl", name: "پیاله" },
      ],
    },
  ]),
  listPrograms: vi.fn().mockResolvedValue([
    {
      id: "prog-1",
      name: "برنامه طلایی پاکسازی کبد و مقاومت انسولین",
      description: "مهندسی غذایی جهت شکستن رسوب چربی احشایی با کاسنی و روغن زیتون",
      organizationContext: "clinics",
      planType: "کبد چرب گرید ۱ و ۲",
      durationDays: 30,
      price: "890000",
      practitionerName: "دکتر لیلا سادات",
      practitionerPhone: "09121112233",
    },
    {
      id: "prog-2",
      name: "برنامه رژیم درمانی دیابت",
      description: "کنترل قند خون و بار گلیسمی",
      organizationContext: "clinics",
      planType: "دیابت نوع ۲",
      durationDays: 60,
      price: "1200000",
      practitionerName: "دکتر احمد رضایی",
      practitionerPhone: "09122223344",
    },
  ]),
  myClaims: vi.fn().mockResolvedValue([
    {
      programId: "prog-2",
      status: "pending",
    },
  ]),
  searchFoods: vi.fn().mockResolvedValue({
    rows: [
      {
        id: "f-ghormeh",
        name: "قورمه‌سبزی سنتی با گوشت گوسفندی",
        category: "خورش‌های سنتی",
      },
      {
        id: "f-rice",
        name: "چلو کته با برنج طارم دمسیاه",
        category: "پلو و چلوها",
      },
    ],
    total: 2,
  }),
  getFoodDetail: vi.fn().mockImplementation((id: string) => {
    if (id === "non-existent") return Promise.resolve(null);
    return Promise.resolve({
      id: "f-ghormeh",
      name: "خورشت قورمه‌سبزی سنتی",
      category: "خورش‌های سنتی",
      servingUnits: [
        { id: "su-kafgir", name: "۱ کفگیر", gramsEquivalent: "180" },
        { id: "su-bowl", name: "۱ کاسه متوسط", gramsEquivalent: "250" },
        { id: "su-spoon", name: "۱ قاشق غذاخوری", gramsEquivalent: "15" },
      ],
      nutrients: [
        {
          nutrientId: "n-energy",
          name: "انرژی کل",
          unit: "kcal",
          amountPer100g: "155",
        },
        {
          nutrientId: "n-protein",
          name: "پروتئین خالص",
          unit: "g",
          amountPer100g: "10",
        },
        {
          nutrientId: "n-carbs",
          name: "کربوهیدرات",
          unit: "g",
          amountPer100g: "4.5",
        },
        {
          nutrientId: "n-fat",
          name: "چربی کل",
          unit: "g",
          amountPer100g: "11",
        },
        {
          nutrientId: "n-iron",
          name: "آهن قابل جذب (Fe)",
          unit: "mg",
          amountPer100g: "3.4",
        },
      ],
    });
  }),
}));

// Mock database for category lookup in FoodsPage
vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        groupBy: () => ({
          orderBy: () =>
            Promise.resolve([
              { category: "خورش‌های سنتی" },
              { category: "پلو و چلوها" },
              { category: "نان و غلات" },
            ]),
        }),
      }),
    }),
  },
}));

describe("Nutrition Subsystem Overhaul (Task 7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. NutritionLayout", () => {
    it("renders clinical medical banner with endorsement and confidentiality badge", async () => {
      const jsx = await NutritionLayout({
        children: <div data-testid="child-content">محتوای تستی</div>,
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("سامانه پایش بالینی تغذیه و متابولیسم انگبین طب");
      expect(html).toContain("استانداردهای انجمن غدد و دیابت");
      expect(html).toContain("پرونده سلامت محرمانه");
      expect(html).toContain("محتوای تستی");
    });

    it("renders all 5 sub-navigation tabs with correct hrefs matching brief requirements", async () => {
      const jsx = await NutritionLayout({
        children: <div>تست</div>,
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("پیشخوان تغذیه");
      expect(html).toContain('href="/fa/nutrition"');
      expect(html).toContain("نمایه بدن من");
      expect(html).toContain('href="/fa/nutrition/body"');
      expect(html).toContain("دفترچه غذایی امروز");
      expect(html).toContain('href="/fa/nutrition/diary"');
      expect(html).toContain("برنامه‌های رژیمی");
      expect(html).toContain('href="/fa/nutrition/diet"');
      expect(html).toContain("بانک غذاهای ایرانی");
      expect(html).toContain('href="/fa/nutrition/foods"');
    });
  });

  describe("2. NutritionHomePage (Screen #14 — Nutrition Hub Dashboard)", () => {
    it("renders anthropometric summary bar with weight, target weight, height, and BMI", async () => {
      const jsx = await NutritionHomePage({
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("پیشخوان پایش تغذیه و سلامت");
      expect(html).toContain("وزن فعلی");
      expect(html).toContain("وزن هدف");
      expect(html).toContain("قد ثبت‌شده");
      expect(html).toContain("شاخص توده بدنی (BMI)");
    });

    it("renders energy and macro balance radial widget with macros and hydration indicator", async () => {
      const jsx = await NutritionHomePage({
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("بیلان انرژی و تراز درشت‌مغذی‌ها (امروز)");
      expect(html).toContain("محدوده سوخت‌وساز پایه");
      expect(html).toContain("هدف کل");
      expect(html).toContain("کالری دریافت‌شده");
      expect(html).toContain("کربوهیدرات پیچیده و ساده");
      expect(html).toContain("پروتئین خالص");
      expect(html).toContain("چربی‌های مفید و غیراشباع");
      expect(html).toContain("مصرف آب و عرقیجات سنتی");
    });

    it("renders key clinical action shortcuts bento grid", async () => {
      const jsx = await NutritionHomePage({
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("دستورات و میانبرهای سریع بالینی");
      expect(html).toContain("ثبت وعده در دفترچه کالری‌شمار");
      expect(html).toContain("محاسبه شاخص‌های فیزیولوژیک");
      expect(html).toContain("بانک غذاهای اصیل ایرانی");
      expect(html).toContain("برنامه رژیم تخصصی بالینی");
    });

    it("renders today's logged meals summary cards and featured diet plans preview", async () => {
      const jsx = await NutritionHomePage({
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("دفترچه وعده‌های غذایی امروز");
      expect(html).toContain("صبحانه کامل");
      expect(html).toContain("ناهار سنتی");
      expect(html).toContain("عصرانه و دمنوش");
      expect(html).toContain("شام امروز");
      expect(html).toContain("برنامه‌های رژیم درمانی منتخب انگبین طب");
      expect(html).toContain("برنامه طلایی پاکسازی کبد و مقاومت انسولین");
    });
  });

  describe("3. BodyPage (Screen #41 — Biometric Body Profile)", () => {
    it("renders BMR, TDEE, and BMI status cards", async () => {
      const jsx = await BodyPage({
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("متابولیسم پایه (BMR)");
      expect(html).toContain("کالری مصرفی کل (TDEE)");
      expect(html).toContain("شاخص توده بدنی (BMI)");
    });

    it("renders physiological data form with inputs matching schema: sex, birthDate, heightCm, weightKg, activityLevel", async () => {
      const jsx = await BodyPage({
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain('name="sex"');
      expect(html).toContain('name="birthDate"');
      expect(html).toContain('name="heightCm"');
      expect(html).toContain('name="weightKg"');
      expect(html).toContain('name="activityLevel"');
      expect(html).toContain("محاسبه و ذخیره در پرونده سلامت");
    });

    it("renders daily calorie targets by goal: deficit, maintain, surplus", async () => {
      const jsx = await BodyPage({
        params: Promise.resolve({ locale: "fa" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("برنامه کالری روزانه بر اساس هدف شما");
      expect(html).toContain("کاهش وزن آرام");
      expect(html).toContain("تثبیت وزن");
      expect(html).toContain("افزایش وزن تمیز");
    });
  });

  describe("4. DiaryPage & LogFood (Screen #11 — Food Diary & Tracker)", () => {
    it("renders daily intake progress card and macro indicators", async () => {
      const jsx = await DiaryPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ day: "2026-09-04" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("دفترچه غذایی و کالری روزانه");
      expect(html).toContain("کالری مصرفی امروز");
      expect(html).toContain("پروتئین");
      expect(html).toContain("کربوهیدرات");
      expect(html).toContain("چربی");
      // Preserves 276 kcal visible in text for Playwright contract
      expect(html).toMatch(/276/);
    });

    it("renders list of logged meals with traditional Iranian measurement units", async () => {
      const jsx = await DiaryPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ day: "2026-09-04" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("آش رشته");
      expect(html).toContain("بشقاب");
    });

    it("renders 7-day date navigator", async () => {
      const jsx = await DiaryPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ day: "2026-09-04" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("انتخاب تاریخ پرونده");
      expect(html).toContain("?day=2026-09-04");
    });

    it("preserves Playwright E2E contract in LogFood component (Food, Serving, Quantity, Log intake)", () => {
      const jsx = (
        <LogFood
          foods={[
            {
              id: "f-ash",
              name: "آش رشته",
              servingUnits: [
                { id: "su-plate", name: "بشقاب" },
                { id: "su-bowl", name: "پیاله" },
              ],
            },
          ]}
        />
      );
      const html = renderToString(jsx);

      // Label Food or aria-label Food
      expect(html).toContain('aria-label="Food"');
      expect(html).toContain("Food");

      // Label Serving or aria-label Serving
      expect(html).toContain('aria-label="Serving"');
      expect(html).toContain("Serving");

      // Label Quantity or aria-label Quantity
      expect(html).toContain('aria-label="Quantity"');
      expect(html).toContain("Quantity");

      // Button with Log intake
      expect(html).toContain('aria-label="Log intake"');
      expect(html).toContain("Log intake");
    });
  });

  describe("5. DietPage (Screens #16, #24, #26 — Clinical Diet Plans)", () => {
    it("renders organization context selector with all 5 contexts", async () => {
      const jsx = await DietPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ context: "clinics" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("کلینیک‌های تخصصی");
      expect(html).toContain("مراکز جامع سلامت");
      expect(html).toContain("بانک‌ها و موسسات مالی");
      expect(html).toContain("دانشگاه‌ها و مراکز علمی");
      expect(html).toContain("الگوهای عمومی و سازمان‌ها");
      expect(html).toContain('value="banks"');
      expect(html).toContain('value="universities"');
      expect(html).toContain('value="health_centers"');
      expect(html).toContain('value="clinics"');
      expect(html).toContain('value="other"');
    });

    it("renders clinical diet package cards with duration, price, and specialist attribution", async () => {
      const jsx = await DietPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ context: "clinics" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("برنامه طلایی پاکسازی کبد و مقاومت انسولین");
      expect(html).toContain("۳۰");
      expect(html).toContain("۸۹۰٬۰۰۰");
      expect(html).toContain("تومان");
      expect(html).toContain("دکتر لیلا سادات");
    });

    it("renders Claim button for unclaimed programs and Pending badge for claimed programs", async () => {
      const jsx = await DietPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ context: "clinics" }),
      });
      const html = renderToString(jsx);

      // prog-1 is unclaimed: shows Claim button
      expect(html).toContain('aria-label="Claim"');
      expect(html).toContain("Claim");

      // prog-2 is claimed: shows Pending badge
      expect(html).toContain('aria-label="Pending"');
      expect(html).toContain("Pending");
    });
  });

  describe("6. FoodsPage (Screen #36 — Persian Food Database)", () => {
    it("renders search input with aria-label, category selector, and household serving guide", async () => {
      const jsx = await FoodsPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ q: "", category: "", page: "1" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain('aria-label="Search foods"');
      expect(html).toContain("دایرکتوری خوراک‌ها و غذاهای اصیل ایرانی");
      expect(html).toContain("راهنمای مقیاس‌های بومی");
      expect(html).toContain("یک کفگیر برنج یا خورش");
      expect(html).toContain("یک کف دست نان سنتی");
      expect(html).toContain("یک پیاله یا کاسه ماست");
      expect(html).toContain("یک قاشق روغن یا عسل");
    });

    it("renders food items grid from query results", async () => {
      const jsx = await FoodsPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ q: "", category: "", page: "1" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("قورمه‌سبزی سنتی با گوشت گوسفندی");
      expect(html).toContain("چلو کته با برنج طارم دمسیاه");
      expect(html).toContain('href="/fa/foods/f-ghormeh"');
    });
  });

  describe("7. FoodDetailPage (Screen #17 — Food Detail & Nutrients)", () => {
    it("renders food title, traditional serving units, and nutrient table", async () => {
      const jsx = await FoodDetailPage({
        params: Promise.resolve({ locale: "fa", id: "f-ghormeh" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("خورشت قورمه‌سبزی سنتی");
      expect(html).toContain("۱ کفگیر");
      expect(html).toContain("۱۸۰");
      expect(html).toContain("۱ کاسه متوسط");
      expect(html).toContain("۲۵۰");
      expect(html).toContain("املاح، ویتامین‌ها و ریزمغذی‌های شاخص");
      expect(html).toContain("آهن قابل جذب (Fe)");
    });

    it("renders doctor clinical advice and complementary Persian table pairing cards", async () => {
      const jsx = await FoodDetailPage({
        params: Promise.resolve({ locale: "fa", id: "f-ghormeh" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain("توصیه بالینی متخصص تغذیه");
      expect(html).toContain("دکتر سحر فرهمندفر");
      expect(html).toContain("خوراک‌های مکمل و چیدمان بهینه سفره");
      expect(html).toContain("پلو کته زعفرانی کم‌روغن");
      expect(html).toContain("سالاد شیرازی با آبغوره سنتی");
      expect(html).toContain("ماست و نعناع پروبیوتیک سنتی");
    });

    it("renders embedded LogFood component in food detail", async () => {
      const jsx = await FoodDetailPage({
        params: Promise.resolve({ locale: "fa", id: "f-ghormeh" }),
      });
      const html = renderToString(jsx);

      expect(html).toContain('aria-label="Food"');
      expect(html).toContain('aria-label="Serving"');
      expect(html).toContain('aria-label="Quantity"');
      expect(html).toContain('aria-label="Log intake"');
    });

    it("throws notFound when food does not exist", async () => {
      await expect(
        FoodDetailPage({
          params: Promise.resolve({ locale: "fa", id: "non-existent" }),
        })
      ).rejects.toThrow("NEXT_NOT_FOUND");
    });
  });
});
