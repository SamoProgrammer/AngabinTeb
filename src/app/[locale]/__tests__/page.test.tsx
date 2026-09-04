import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import HomePage from "../page";

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

describe("Landing Page SSR (src/app/[locale]/page.tsx)", () => {
  async function renderHomePage(locale = "fa") {
    const jsx = await HomePage({
      params: Promise.resolve({ locale }),
    });
    return renderToString(jsx);
  }

  it("1. renders Hero headline and subtitle correctly", async () => {
    const html = await renderHomePage();

    // Badge
    expect(html).toContain("سامانه یکپارچه سلامت، درمان و تغذیه بالینی");
    expect(html).toContain("health_and_safety");

    // Main Headline
    expect(html).toContain(
      "مسیر هوشمند پایش سلامت و نوبت‌دهی معتبرترین پزشکان متخصص"
    );

    // Subheading
    expect(html).toContain(
      "تجمیع خدمات بالینی، پاراکلینیک، سنجش متابولیسم و مشاوره‌های تخصصی تغذیه بر اساس الگوهای بومی ایران، بدون کارمزد آنلاین و با پرداخت در مطب."
    );

    // Universal Search Bar inside Hero
    expect(html).toContain("main-search-input");
    expect(html).toContain("جستجوی هوشمند");
    expect(html).toContain("بدون کارمزد آنلاین (پرداخت در مطب)");
  });

  it("2. renders 5 quick action links with valid hrefs and icons", async () => {
    const html = await renderHomePage();

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

  it("3. renders Featured Specialists section with 4 doctor cards", async () => {
    const html = await renderHomePage();

    // Section header and all-doctors link
    expect(html).toContain("پزشکان معتمد انگبین طب");
    expect(html).toContain("نوبت‌های آماده رزرو در هفته جاری");
    expect(html).toContain("مشاهده همه پزشکان");

    // 4 Doctor Cards
    expect(html).toContain("دکتر لیلا سادات");
    expect(html).toContain("فوق تخصص غدد و متابولیسم");

    expect(html).toContain("دکتر آرش رادمنش");
    expect(html).toContain("متخصص تغذیه بالینی و رژیم‌درمانی");

    expect(html).toContain("دکتر سارا مهدوی");
    expect(html).toContain("متخصص قلب، عروق و اکوکاردیوگرافی");

    expect(html).toContain("دکتر پیام بهرامی");
    expect(html).toContain("فوق تخصص بیماری‌های گوارش و کبد");

    // Booking CTA on doctor cards
    expect(html).toContain("رزرو حضوری (پرداخت در مطب)");
  });

  it("4. renders Paraclinical Services section with 4 service cards", async () => {
    const html = await renderHomePage();

    // Section header and all-services link
    expect(html).toContain("خدمات پاراکلینیک دارای استانداردهای بالینی");
    expect(html).toContain("بسته‌های تشخیصی و آزمایش‌های برگزیده");
    expect(html).toContain("مشاهده کلیه خدمات");

    // 4 Service Cards
    expect(html).toContain("چکاپ جامع متابولیک و قند ناشتا");
    expect(html).toContain("ارزیابی بادی کامپوزیشن (InBody 770)");
    expect(html).toContain("مشاوره بالینی تغذیه");
    expect(html).toContain("اکوکاردیوگرافی داپلر و نوار قلب");

    // Service booking CTA
    expect(html).toContain("رزرو نوبت آزمایش");
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
    expect(html).toContain(
      "ورود به دفترچه تغذیه با سفره ایرانی (کفگیر، پیاله، پرس)"
    );
  });

  it("6. renders Clinical Knowledge & Video Library showcase", async () => {
    const html = await renderHomePage();

    // Section header and archive link
    expect(html).toContain("دانشنامه و رسانه پزشکی انگبین طب");
    expect(html).toContain("تازه‌های بالینی و ویدیوهای آموزشی سلامت");
    expect(html).toContain("مشاهده آرشیو کامل مقالات");

    // Article Cards
    expect(html).toContain(
      "راهنمای بالینی کنترل کبد چرب گرید ۱ و ۲ با اصلاح سفره غذایی ایرانی"
    );
    expect(html).toContain("گوارش و کبد");

    expect(html).toContain(
      "چگونه کالری پلوهای سنتی (کته، ته‌چین و شویدپلو) را دقیق ثبت کنیم؟"
    );
    expect(html).toContain("کالری‌شماری بومی");

    // Video Card
    expect(html).toContain(
      "نشانه‌های اولیه مقاومت به انسولین چیست؟ راهکارهای مداخله زودهنگام"
    );
    expect(html).toContain("ویدیو پزشکی");
    expect(html).toContain("تماشای ویدیو");
  });

  it("7. renders Trust & Transparency section with metrics and pillars", async () => {
    const html = await renderHomePage();

    // Key metrics
    expect(html).toContain("+۱۲۰");
    expect(html).toContain("پزشک متخصص");
    expect(html).toContain("+۴۵k");
    expect(html).toContain("نوبت موفق");
    expect(html).toContain("+۸۰۰");
    expect(html).toContain("بانک اطلاعات غذایی");
    expect(html).toContain("۱۰۰٪");
    expect(html).toContain("پرداخت در مطب");

    // Trust pillars
    expect(html).toContain("حفاظت از پرونده بالینی");
    expect(html).toContain("تعرفه مصوب وزارت بهداشت");
    expect(html).toContain("پشتیبانی اختصاصی بیمار");
  });

  it("supports locale parameter for link generation", async () => {
    const html = await renderHomePage("en");

    expect(html).toContain('href="/en/doctors"');
    expect(html).toContain('href="/en/services"');
    expect(html).toContain('href="/en/nutrition/diary"');
    expect(html).toContain('href="/en/nutrition/diet"');
    expect(html).toContain('href="/en/articles"');
  });
});
