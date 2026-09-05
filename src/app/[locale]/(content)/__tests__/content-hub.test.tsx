import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";

import ArticlesPage from "../articles/page";
import ArticlePage from "../articles/[slug]/page";
import TopicsPage from "../topics/page";
import TopicHubPage from "../topics/[slug]/page";
import VideosPage from "../videos/page";
import ConditionPage from "../conditions/[slug]/page";
import FaqPage from "../faq/page";
import { FaqClient } from "../faq/faq-client";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/fa/articles",
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

// Mock Content Queries
vi.mock("@/contexts/content/queries", () => ({
  listTopics: vi.fn().mockResolvedValue([
    { id: "top-1", slug: "diabetes", name: "دیابت و متابولیسم", count: 14 },
    { id: "top-2", slug: "heart", name: "سلامت قلب و عروق", count: 8 },
    { id: "top-3", slug: "liver", name: "کبد چرب و گوارش", count: 11 },
  ]),
  listContent: vi.fn().mockImplementation((kind: string) => {
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
    if (kind === "faq") {
      return Promise.resolve({
        rows: [
          {
            id: "faq-db-1",
            slug: "faq-booking-steps",
            title: "آیا برای رزرو آنلاین نوبت هزینه‌ای دریافت می‌شود؟",
            body: "خیر، رزرو نوبت در انگبین طب کاملاً رایگان است.",
            videoUrl: null,
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
        {
          id: "art-2",
          slug: "fatty-liver-diet",
          title: "رژیم غذایی کبد چرب گرید ۱ و ۲ در سفره ایرانی",
          body: "اصلاح الگوی غذایی سفره ایرانی رکن اصلی مدیریت کبد چرب است.",
          videoUrl: null,
          publishedAt: new Date("2026-05-12T10:00:00Z"),
        },
      ],
      total: 2,
    });
  }),
  getContent: vi.fn().mockImplementation((slug: string) => {
    if (slug === "faq-booking-steps") {
      return Promise.resolve({
        id: "faq-db-1",
        kind: "faq",
        slug: "faq-booking-steps",
        title: "آیا برای رزرو آنلاین نوبت هزینه‌ای دریافت می‌شود؟",
        body: "خیر، رزرو نوبت در انگبین طب کاملاً رایگان است.",
        videoUrl: null,
        publishedAt: new Date("2026-05-10T10:00:00Z"),
      });
    }
    if (slug === "not-found") return Promise.resolve(null);
    return Promise.resolve({
      id: "art-1",
      kind: "article",
      slug: "insulin-resistance-guide",
      title: "راهنمای بالینی مدیریت مقاومت به انسولین و دیابت",
      body: "مقاومت به انسولین شایع‌ترین اختلال متابولیک زیربنایی در جامعه ایرانی امروز است.\n\nتغییر سبک زندگی و تغذیه سالم رکن اصلی درمان است.",
      videoUrl: null,
      publishedAt: new Date("2026-05-10T10:00:00Z"),
    });
  }),
  getTopicHub: vi.fn().mockImplementation((slug: string) => {
    if (slug === "not-found") return Promise.resolve(null);
    return Promise.resolve({
      topic: { id: "top-1", slug: "diabetes", name: "دیابت و متابولیسم" },
      content: [
        {
          id: "art-1",
          slug: "insulin-resistance-guide",
          title: "راهنمای بالینی مدیریت مقاومت به انسولین و دیابت",
          body: "مقاومت به انسولین شایع‌ترین اختلال متابولیک زیربنایی در جامعه ایرانی امروز است.",
          videoUrl: null,
          publishedAt: new Date("2026-05-10T10:00:00Z"),
        },
      ],
      conditions: [
        { id: "cond-1", slug: "type-2-diabetes", name: "دیابت نوع ۲" },
        { id: "cond-2", slug: "prediabetes", name: "پیش‌دیابت" },
      ],
      relatedServices: [
        {
          id: "srv-1",
          type: "service",
          title: "چکاپ متابولیک و قند سه ماهه HbA1c",
          subtitle: "پایش آزمایشگاهی پیشرفته",
          href: "/services/metabolic-checkup",
        },
      ],
      relatedDoctors: [
        {
          id: "doc-1",
          type: "doctor",
          title: "دکتر لیلا سادات",
          subtitle: "فوق‌تخصص غدد و متابولیسم",
          href: "/doctors/dr-sadat",
        },
      ],
    });
  }),
  getCondition: vi.fn().mockImplementation((slug: string) => {
    if (slug === "not-found") return Promise.resolve(null);
    return Promise.resolve({
      id: "cond-1",
      slug: "type-2-diabetes",
      name: "دیابت نوع ۲",
    });
  }),
}));

// Mock Catalog Queries (for ConditionPage linked services & doctors)
vi.mock("@/contexts/catalog/queries", () => ({
  searchAll: vi.fn().mockImplementation(() => {
    return Promise.resolve([
      {
        id: "srv-cond-1",
        type: "service",
        title: "چکاپ تخصصی و آزمایش قند خون",
        subtitle: "پایش آزمایشگاهی متابولیک",
        href: "/services/blood-sugar-test",
      },
      {
        id: "doc-cond-1",
        type: "doctor",
        title: "دکتر مریم شریفی",
        subtitle: "فوق تخصص غدد و متابولیسم",
        href: "/doctors/dr-sharifi",
      },
    ]);
  }),
}));

describe("Content Hub SSR Pages", () => {
  it("renders ArticlesPage with category pills and stored article cards", async () => {
    const pageJsx = await ArticlesPage({
      params: Promise.resolve({ locale: "fa" }),
      searchParams: Promise.resolve({}),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("مجله سلامت");
    expect(html).toContain("همه مقالات");
    expect(html).toContain("دیابت و متابولیسم");
    expect(html).toContain("سلامت قلب و عروق");
    expect(html).toContain("راهنمای بالینی مدیریت مقاومت به انسولین و دیابت");
    // Stored excerpt renders; no index-derived authors, topics, or reading times
    expect(html).toContain("شایع‌ترین اختلال متابولیک");
    expect(html).not.toContain("دکتر لیلا سادات");
    expect(html).not.toContain("دکتر فرهاد مرادی");
    expect(html).not.toContain("دکتر آرش رادمنش");
    expect(html).not.toContain("دقیقه مطالعه");
    // Redundant kicker badge above headings removed
    expect(html).not.toContain("دانشنامه سلامت");
    expect(html).not.toContain("پایگاه دانش و مقالات سلامت بالینی");
  });

  it("renders ArticlePage reader with breadcrumbs and stored body only", async () => {
    const pageJsx = await ArticlePage({
      params: Promise.resolve({ locale: "fa", slug: "insulin-resistance-guide" }),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("مجله سلامت");
    expect(html).toContain("راهنمای بالینی مدیریت مقاومت به انسولین و دیابت");
    expect(html).toContain("مقاومت به انسولین شایع‌ترین اختلال متابولیک");
    // No hardcoded author, audio banner, clinical pearl, or takeaways
    expect(html).not.toContain("دکتر لیلا سادات");
    expect(html).not.toContain("نسخه صوتی مقاله");
    expect(html).not.toContain("نکته کلیدی بالینی");
    expect(html).not.toContain("دقیقه مطالعه");
    expect(html).not.toContain("دانشنامه سلامت");
    expect(html).toContain("دریافت نوبت ویزیت با پزشک");
  });

  it("renders TopicsPage directory with clinical cards and item counts", async () => {
    const pageJsx = await TopicsPage({
      params: Promise.resolve({ locale: "fa" }),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("موضوعات و مراکز تخصصی سلامت");
    expect(html).toContain("دیابت و متابولیسم");
    expect(html).toContain("سلامت قلب و عروق");
    expect(html).toContain("کبد چرب و گوارش");
    expect(html).toContain("پایگاه ۳۶۰°");
  });

  it("renders TopicHubPage with topic heading, links, and related care without fake telemetry", async () => {
    const pageJsx = await TopicHubPage({
      params: Promise.resolve({ locale: "fa", slug: "diabetes" }),
    });
    const html = renderToString(pageJsx);

    // Meets e2e/knowledge.spec.ts requirements:
    // heading matches /دیابت/
    expect(html).toMatch(/<h1[^>]*>[\s\S]*?دیابت[\s\S]*?<\/h1>/);
    // links match /دیابت/
    expect(html).toMatch(/<a[^>]*href="[^"]*"[^>]*>[\s\S]*?دیابت[\s\S]*?<\/a>/);
    expect(html).toContain("دیابت و متابولیسم");
    // Fake static telemetry card removed
    expect(html).not.toContain("شاخص‌های هدف بالینی");
    expect(html).not.toContain("پایش منظم روزانه");
    expect(html).not.toContain("چکاپ دوره‌ای");
    // Care pathway links intact
    expect(html).toContain("دیابت نوع ۲");
    expect(html).toContain("چکاپ متابولیک و قند سه ماهه HbA1c");
    expect(html).toContain("دکتر لیلا سادات");
  });

  it("renders VideosPage with stored video cards and no repetitive badges or invented speakers", async () => {
    const pageJsx = await VideosPage({
      params: Promise.resolve({ locale: "fa" }),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("ویدیوها و وبینارهای تخصصی پزشکی");
    expect(html).toContain("راهنمای تصویری کنترل قند خون ناشتا");
    expect(html).toContain("آموزش تصویری اندازه‌گیری قند خون");
    expect(html).toContain("تماشای ویدیو");
    expect(html).not.toContain("ویدیوی تایید شده");
    expect(html).not.toContain("آموزش تصویری سلامت و نکات بالینی");
    expect(html).not.toContain("دکتر لیلا سادات");
    expect(html).not.toContain("دکتر احسان آریا");
  });

  it("renders ConditionPage with tailored pathway, linked services, and doctors without copy-paste boxes", async () => {
    const pageJsx = await ConditionPage({
      params: Promise.resolve({ locale: "fa", slug: "type-2-diabetes" }),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("دیابت نوع ۲");
    // Duplicate copy-pasted diagnostic boxes removed
    expect(html).not.toContain("علائم شایع و هشدار دهنده");
    expect(html).not.toContain("آزمایش‌های تشخیصی پیشنهادی");
    expect(html).not.toContain("احساس خستگی مفرط، تغییرات وزنی بی‌دلیل");
    // Tailored linked services and doctors rendered
    expect(html).toContain("چکاپ تخصصی و آزمایش قند خون");
    expect(html).toContain("دکتر مریم شریفی");
  });

  it("renders FaqPage with live entries and no hardcoded defaults", async () => {
    const pageJsx = await FaqPage({
      params: Promise.resolve({ locale: "fa" }),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("پرسش‌های متداول و راهنمای مراجعین");
    expect(html).toContain("آیا برای رزرو آنلاین نوبت هزینه‌ای دریافت می‌شود؟");
    expect(html).toContain("ارتباط با پشتیبانی مراجعین");
    // Default hardcoded list deleted: insurance/privacy defaults never render
    expect(html).not.toContain("تحت پوشش بیمه‌های پایه و تکمیلی");
    expect(html).not.toContain("اطلاعات پرونده و آزمایش‌های من");
    expect(html).not.toContain("نوبت‌دهی و لغو نوبت");
  });

  it("renders FaqClient with live entries only", () => {
    const html = renderToString(
      <FaqClient
        locale="fa"
        dbFaqs={[{ id: "faq-1", title: "سوال زنده؟", body: "پاسخ زنده." }]}
      />,
    );
    expect(html).toContain("سوال زنده؟");
    expect(html).not.toContain("تحت پوشش بیمه‌های پایه و تکمیلی");
  });

  it("renders FaqClient empty state when no live entries exist", () => {
    const html = renderToString(<FaqClient locale="fa" />);
    expect(html).toContain("هنوز پرسش متداولی ثبت نشده است.");
  });

  it("renders FaqClient with category tabs when categories are present", () => {
    const html = renderToString(
      <FaqClient
        locale="fa"
        dbFaqs={[
          { id: "faq-1", title: "نوبت‌دهی چگونه است؟", body: "به سادگی از سایت رزرو کنید.", category: "نوبت‌دهی" },
          { id: "faq-2", title: "بیمه تکمیلی پذیرفته می‌شود؟", body: "بله، فاکتور صادر می‌شود.", category: "بیمه" },
        ]}
      />,
    );
    expect(html).toContain("همه موارد");
    expect(html).toContain("نوبت‌دهی");
    expect(html).toContain("بیمه");
  });
});
