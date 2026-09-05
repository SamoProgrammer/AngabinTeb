import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import HomePage from "../page";
import { listDoctors, listServices } from "@/contexts/catalog/queries";
import { listContent } from "@/contexts/content/queries";
import { getTranslations } from "next-intl/server";
import faMessages from "../../../../messages/fa.json";
import enMessages from "../../../../messages/en.json";

// Mock Next.js navigation for SSR in Node environment
vi.mock("next/navigation", () => ({
  usePathname: () => "/fa",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "fa",
  useTranslations: () => (key: string) => key,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(),
}));

type Catalog = Record<string, Record<string, string>>;
const faCatalog = faMessages as unknown as Catalog;
const enCatalog = enMessages as unknown as Catalog;

function mockCatalog(catalog: Catalog) {
  vi.mocked(getTranslations).mockImplementation(
    ((namespace: string) =>
      Promise.resolve((key: string) => catalog[namespace]?.[key] ?? key)) as unknown as typeof getTranslations,
  );
}

vi.mock("@/contexts/catalog/queries", () => ({
  listDoctors: vi.fn(),
  listServices: vi.fn(),
}));

vi.mock("@/contexts/content/queries", () => ({
  listContent: vi.fn(),
}));

const mockListDoctors = vi.mocked(listDoctors);
const mockListServices = vi.mocked(listServices);
const mockListContent = vi.mocked(listContent);

function mockSeeded() {
  mockListDoctors.mockResolvedValue({
    rows: [
      {
        id: "doc-1",
        name: "دکتر مریم شریفی",
        specialty: "فوق تخصص غدد و متابولیسم",
        cityId: "tehran",
        imageUrl: null,
      },
      {
        id: "doc-2",
        name: "دکتر نیما کریمی",
        specialty: null,
        cityId: null,
        imageUrl: null,
      },
    ],
    total: 2,
  });
  mockListServices.mockResolvedValue({
    rows: [
      {
        id: "svc-1",
        name: "آزمایش قند خون و HbA1c",
        providerName: "آزمایشگاه پاتوبیولوژی مرکزی",
        serviceType: "diagnostic",
        category: "آزمایشگاه بالینی",
        cityId: "tehran",
        price: "180000",
        durationMinutes: 20,
      },
    ],
    total: 1,
  });
  mockListContent.mockImplementation((kind: string) => {
    if (kind === "video") {
      return Promise.resolve({
        rows: [
          {
            id: "vid-1",
            slug: "diabetes-video-guide",
            title: "راهنمای تصویری کنترل قند خون ناشتا",
            body: "آموزش تصویری اندازه‌گیری قند خون و تفسیر نتایج.",
            videoUrl: "https://example.com/videos/diabetes.mp4",
            publishedAt: new Date("2026-05-10T10:00:00Z"),
          },
        ],
        total: 1,
      });
    }
    return Promise.resolve({
      rows: [
        {
            id: "art-1",
            slug: "insulin-resistance-guide",
            title: "راهنمای بالینی مدیریت مقاومت به انسولین و دیابت",
            body: "مقاومت به انسولین شایع‌ترین اختلال متابولیک زیربنایی در جامعه ایرانی امروز است.",
            videoUrl: null,
            publishedAt: new Date("2026-05-10T10:00:00Z"),
        },
      ],
      total: 1,
    });
  });
}

function mockEmpty() {
  mockListDoctors.mockResolvedValue({ rows: [], total: 0 });
  mockListServices.mockResolvedValue({ rows: [], total: 0 });
  mockListContent.mockResolvedValue({ rows: [], total: 0 });
}

describe("Landing Page SSR (src/app/[locale]/page.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCatalog(faCatalog);
    mockSeeded();
  });

  async function renderHomePage(locale = "fa") {
    const jsx = await HomePage({
      params: Promise.resolve({ locale }),
    });
    return renderToString(jsx);
  }

  it("1. renders Hero headline and subtitle correctly", async () => {
    const html = await renderHomePage();

    // No decorative badge
    expect(html).not.toContain("سامانه یکپارچه سلامت، درمان و تغذیه بالینی");

    // Main Headline
    expect(html).toContain("مرجع نوبت‌دهی پزشکی، خدمات سلامت و تغذیه بالینی");

    // Subheading
    expect(html).toContain(
      "دسترسی مستقیم به پزشکان متخصص، مراکز معتبر درمانی و سنجش علمی سوخت‌وساز بدن بر اساس استانداردهای بومی ایران."
    );

    // Universal Search Bar inside Hero
    expect(html).toContain("main-search-input");
    expect(html).toContain("جستجو");
    expect(html).toContain("بدون کارمزد آنلاین (پرداخت در مطب)");
  });

  it("2. renders 5 quick action links with valid hrefs and icons", async () => {
    const html = await renderHomePage();

    // Care Pathways section heading without kicker
    expect(html).toContain("مراقبت تخصصی سلامت بر اساس نیاز شما");
    expect(html).not.toContain("دسترسی سریع بیماران و مراجعان");
    expect(html).not.toContain("مسیرهای مراقبت ۳۶۰ درجه");

    // Quick Action 1: نوبت‌دهی پزشکان
    expect(html).toContain("نوبت‌دهی پزشکان");
    expect(html).toContain('href="/fa/doctors"');
    expect(html).toContain("stethoscope");
    expect(html).toContain("انتخاب پزشک");

    // Quick Action 2: خدمات پاراکلینیک
    expect(html).toContain("خدمات پاراکلینیک");
    expect(html).toContain('href="/fa/services"');
    expect(html).toContain("science");
    expect(html).toContain("فهرست مراکز");

    // Quick Action 3: سنجش سوخت‌وساز
    expect(html).toContain("سنجش سوخت‌وساز");
    expect(html).toContain('href="#metabolism-section"');
    expect(html).toContain("calculate");
    expect(html).toContain("محاسبه سریع");

    // Quick Action 4: دفترچه کالری‌شمار
    expect(html).toContain("دفترچه کالری‌شمار");
    expect(html).toContain('href="/fa/nutrition/diary"');
    expect(html).toContain("restaurant");
    expect(html).toContain("ثبت سفره امروز");

    // Quick Action 5: رژیم‌درمانی تخصصی
    expect(html).toContain("رژیم‌درمانی تخصصی");
    expect(html).toContain('href="/fa/nutrition/diet"');
    expect(html).toContain("spa");
    expect(html).toContain("مشاهده پروتکل‌ها");
  });

  it("3. renders Featured Specialists from listDoctors with bounded limit", async () => {
    const html = await renderHomePage();

    // Section header and all-doctors link stay (without doctorsKicker)
    expect(html).toContain("پزشکان و متخصصان برجسته");
    expect(html).not.toContain("پزشکان معتمد انگبین طب");
    expect(html).not.toContain("کادر درمان معتبر");
    expect(html).toContain("مشاهده همه پزشکان");

    // Same query source as the doctors directory
    expect(mockListDoctors).toHaveBeenCalledWith("fa", undefined, undefined, 1, 4);

    // Seeded doctors render as cards with directory-style links
    expect(html).toContain("دکتر مریم شریفی");
    expect(html).toContain("فوق تخصص غدد و متابولیسم");
    expect(html).toContain('href="/fa/doctors/doc-1"');

    // No invented content — empty-state copy is gone when rows exist
    expect(html).not.toContain("به‌زودی پزشکان معتمد اینجا معرفی می‌شوند");
  });

  it("3b. renders honest empty state when listDoctors returns no rows", async () => {
    mockEmpty();
    const html = await renderHomePage();

    expect(html).toContain("به‌زودی پزشکان معتمد اینجا معرفی می‌شوند");
    expect(html).not.toContain("دکتر مریم شریفی");
  });

  it("3c. renders error state when listDoctors rejects", async () => {
    mockListDoctors.mockRejectedValue(new Error("db down"));
    const html = await renderHomePage();

    expect(html).toContain("خطا در بارگذاری فهرست پزشکان");
    expect(html).not.toContain("به‌زودی پزشکان معتمد اینجا معرفی می‌شوند");
  });

  it("4. renders Paraclinical Services from listServices with bounded limit", async () => {
    const html = await renderHomePage();

    // Section header and all-services link stay (without servicesKicker)
    expect(html).toContain("خدمات تشخیصی و درمانی");
    expect(html).not.toContain("خدمات پاراکلینیک دارای استانداردهای بالینی");
    expect(html).not.toContain("خدمات بالینی و پاراکلینیکی");
    expect(html).toContain("مشاهده کلیه خدمات");

    // Same query source as the services directory
    expect(mockListServices).toHaveBeenCalledWith("fa", undefined, undefined, 1, 6);

    // Seeded service renders as a card with directory-style link
    expect(html).toContain("آزمایش قند خون و HbA1c");
    expect(html).toContain('href="/fa/services/svc-1"');

    // No invented content — empty-state copy is gone when rows exist
    expect(html).not.toContain("به‌زودی خدمات برگزیده اینجا معرفی می‌شوند");
  });

  it("4b. renders honest empty state when listServices returns no rows", async () => {
    mockEmpty();
    const html = await renderHomePage();

    expect(html).toContain("به‌زودی خدمات برگزیده اینجا معرفی می‌شوند");
    expect(html).not.toContain("آزمایش قند خون و HbA1c");
  });

  it("4c. renders error state when listServices rejects", async () => {
    mockListServices.mockRejectedValue(new Error("db down"));
    const html = await renderHomePage();

    expect(html).toContain("خطا در بارگذاری فهرست خدمات");
    expect(html).not.toContain("به‌زودی خدمات برگزیده اینجا معرفی می‌شوند");
  });

  it("5. renders Metabolism section with id='metabolism-section' wrapping calculator", async () => {
    const html = await renderHomePage();

    // Section container with required ID
    expect(html).toContain('id="metabolism-section"');

    // Metabolism calculator elements
    expect(html).toContain("سنجش زنده متابولیسم بدنی و انرژی مصرفی");
    expect(html).toContain("محاسبه‌گر بالینی سوخت‌وساز پایه");
    expect(html).toContain("calc-age");
    expect(html).toContain("calc-height");
    expect(html).toContain("calc-weight");
    expect(html).toContain("bmr-output");
    expect(html).toContain("tdee-output");
    expect(html).toContain("bmi-output");
    expect(html).toContain("ثبت در دفترچه تغذیه");
  });

  it("6. renders Clinical Knowledge from listContent without invented authors", async () => {
    const html = await renderHomePage();

    // Section header and archive link stay (without knowledgeKicker)
    expect(html).toContain("تازه‌ترین مقالات و آموزش‌های پزشکی");
    expect(html).not.toContain("دانشنامه و رسانه پزشکی انگبین طب");
    expect(html).not.toContain("دانشنامه سلامت و سبک زندگی");
    expect(html).toContain("مشاهده آرشیو کامل مقالات");

    // Same query source as the articles/videos directories, by kind
    expect(mockListContent).toHaveBeenCalledWith("article", "fa");
    expect(mockListContent).toHaveBeenCalledWith("video", "fa");

    // Seeded article + video render with directory-style links
    expect(html).toContain("راهنمای بالینی مدیریت مقاومت به انسولین و دیابت");
    expect(html).toContain("راهنمای تصویری کنترل قند خون ناشتا");

    // No invented authors/durations — queries carry none, cards add none
    expect(html).not.toContain("به‌زودی تازه‌های بالینی اینجا منتشر می‌شوند");
    expect(html).not.toContain("دکتر آرش رادمنش");
    expect(html).not.toContain("دکتر لیلا سادات");
  });

  it("6b. renders honest empty state when listContent returns no rows", async () => {
    mockEmpty();
    const html = await renderHomePage();

    expect(html).toContain("به‌زودی تازه‌های بالینی اینجا منتشر می‌شوند");
    expect(html).not.toContain("راهنمای بالینی مدیریت مقاومت به انسولین");
  });

  it("6c. renders error state when listContent rejects", async () => {
    mockListContent.mockRejectedValue(new Error("db down"));
    const html = await renderHomePage();

    expect(html).toContain("خطا در بارگذاری تازه‌های بالینی");
    expect(html).not.toContain("به‌زودی تازه‌های بالینی اینجا منتشر می‌شوند");
  });

  it("7. renders Trust & Transparency section with metrics and pillars", async () => {
    const html = await renderHomePage();

    // Key metrics - humanized, de-slopped authoritative points
    expect(html).toContain("بیش از ۵۰");
    expect(html).toContain("پزشک متخصص");
    expect(html).toContain("پرداخت مستقیم در مطب");
    expect(html).toContain("پشتیبانی روزانه بیماران");
    expect(html).not.toContain("+۴۵k");

    // Trust pillars
    expect(html).toContain("حفاظت از پرونده بالینی");
    expect(html).toContain("تعرفه مصوب وزارت بهداشت");
    expect(html).toContain("پشتیبانی اختصاصی بیمار");
  });

  it("supports locale parameter for link generation", async () => {
    const html = await renderHomePage("en");

    expect(mockListDoctors).toHaveBeenCalledWith("en", undefined, undefined, 1, 4);
    expect(html).toContain('href="/en/doctors"');
    expect(html).toContain('href="/en/services"');
    expect(html).toContain('href="/en/nutrition/diary"');
    expect(html).toContain('href="/en/nutrition/diet"');
    expect(html).toContain('href="/en/articles"');
  });

  it("renders English catalogue strings with LTR direction for locale en (ticket 09)", async () => {
    mockCatalog(enCatalog);
    const html = await renderHomePage("en");

    expect(html).toContain(
      "Smart health monitoring and appointments with trusted specialist doctors"
    );
    expect(html).toContain("Doctor appointments");
    expect(html).toContain("Choose a doctor");
    expect(html).toContain("Appointments open for booking this week");
    expect(html).toContain("View all doctors");
    expect(html).toContain("Featured diagnostic packages and tests");
    expect(html).toContain("Latest clinical updates and health education videos");
    expect(html).toContain('dir="ltr"');
    expect(html).not.toContain(
      "مسیر هوشمند پایش سلامت و نوبت‌دهی معتبرترین پزشکان متخصص"
    );
    expect(html).not.toContain(
      "مرجع نوبت‌دهی پزشکی، خدمات سلامت و تغذیه بالینی"
    );
  });

  it("renders Persian catalogue strings with RTL direction for locale fa (ticket 09)", async () => {
    const html = await renderHomePage("fa");

    expect(html).toContain(
      "مرجع نوبت‌دهی پزشکی، خدمات سلامت و تغذیه بالینی"
    );
    expect(html).toContain('dir="rtl"');
  });
});
