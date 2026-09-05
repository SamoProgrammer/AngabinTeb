import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { UniversalSearchBar } from "@/components/clinical/universal-search-bar";
import { DoctorCard } from "@/components/catalog/doctor-card";
import { ServiceCard } from "@/components/catalog/service-card";
import { TrustMetrics } from "@/components/clinical/trust-metrics";
import { ArticleCard, VideoCard } from "@/components/clinical/media-cards";

// Mock Next.js navigation for SSR in Node environment
vi.mock("next/navigation", () => ({
  usePathname: () => "/fa",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Shared Clinical Primitives & Universal Search", () => {
  describe("UniversalSearchBar", () => {
    it("renders all 4 clinical search tabs with icons", () => {
      const html = renderToString(<UniversalSearchBar locale="fa" />);
      expect(html).toContain("پزشکان و متخصصان");
      expect(html).toContain("خدمات پاراکلینیک");
      expect(html).toContain("رژیم و کالری‌شمار");
      expect(html).toContain("مقالات سلامت");

      // Verify Tab Icons
      expect(html).toContain("stethoscope");
      expect(html).toContain("science");
      expect(html).toContain("restaurant");
      expect(html).toContain("menu_book");
    });

    it("renders dynamic input placeholder matching initial active category", () => {
      const html = renderToString(
        <UniversalSearchBar locale="fa" initialCategory="services" />
      );
      expect(html).toContain(
        "جستجوی خدمات پاراکلینیک، آزمایش خون، چکاپ، تصویربرداری..."
      );
    });

    it("renders search icon, accessible input, and submit button", () => {
      const html = renderToString(<UniversalSearchBar locale="fa" />);
      expect(html).toContain(">search</span>");
      expect(html).not.toContain(">mic</span>");
      expect(html).toContain("جستجو");
      expect(html).toContain(">arrow_back</span>");
    });

    it("renders 3 trust guarantees row below search input", () => {
      const html = renderToString(<UniversalSearchBar locale="fa" />);
      expect(html).toContain("بدون کارمزد آنلاین");
      expect(html).toContain("تضمین نوبت پزشک");
      expect(html).toContain("پشتیبانی تلفنی");
      expect(html).toContain(">check_circle</span>");
      expect(html).toContain(">verified</span>");
      expect(html).toContain(">support_agent</span>");
    });

    it("hides trust guarantees when showGuarantees is false", () => {
      const html = renderToString(
        <UniversalSearchBar locale="fa" showGuarantees={false} />
      );
      expect(html).not.toContain("بدون کارمزد آنلاین");
    });
  });

  describe("DoctorCard", () => {
    const mockDoctor = {
      id: "doc-101",
      name: "دکتر آرش رادمنش",
      specialty: "متخصص تغذیه بالینی و رژیم‌درمانی",
      academicTitle: "فلوشیپ چاقی و متابولیک",
      medicalCouncilCode: "12345",
      imageUrl: "https://example.com/avatar.jpg",
      rating: 4.9,
      reviewsCount: 120,
      nextSlot: "فردا ساعت ۱۰:۳۰",
      clinicAddress: "کلینیک تخصصی ونک، تهران",
      fee: 250000,
      slug: "dr-arash-radmanesh",
      isVerified: true,
    };

    it("renders physician avatar, verified badge, name, specialty, and title without decorative static badges", () => {
      const html = renderToString(<DoctorCard doctor={mockDoctor} locale="fa" />);
      expect(html).toContain("دکتر آرش رادمنش");
      expect(html).toContain("متخصص تغذیه بالینی و رژیم‌درمانی");
      expect(html).toContain("فلوشیپ چاقی و متابولیک");
      expect(html).toContain("https://example.com/avatar.jpg");
      expect(html).toContain(">verified</span>");
      expect(html).toContain("نظام پزشکی: ۱۲۳۴۵");
      expect(html).not.toContain("پزشک تایید شده");
      expect(html).not.toContain("تایید بالینی");
    });

    it("renders star rating pill with Persian digits and review count", () => {
      const html = renderToString(<DoctorCard doctor={mockDoctor} locale="fa" />);
      expect(html).toContain(">star</span>");
      expect(html).toContain("۴.۹");
      expect(html).toContain("۱۲۰ نظر");
    });

    it("renders next slot preview chip with schedule icon", () => {
      const html = renderToString(<DoctorCard doctor={mockDoctor} locale="fa" />);
      expect(html).toContain("نوبت آزاد بعدی:");
      expect(html).toContain("فردا ساعت ۱۰:۳۰");
      expect(html).toContain(">schedule</span>");
    });

    it("renders clinic address with location_on icon", () => {
      const html = renderToString(<DoctorCard doctor={mockDoctor} locale="fa" />);
      expect(html).toContain("محل مطب:");
      expect(html).toContain("کلینیک تخصصی ونک، تهران");
      expect(html).toContain(">location_on</span>");
    });

    it("renders approved tariff with Persian digits and pay-at-clinic badge", () => {
      const html = renderToString(<DoctorCard doctor={mockDoctor} locale="fa" />);
      expect(html).toContain("حق ویزیت مصوب:");
      expect(html).toContain("۲۵۰,۰۰۰ تومان");
      expect(html).toContain("پرداخت در مطب");
    });

    it("renders booking CTA button with link to physician profile", () => {
      const html = renderToString(<DoctorCard doctor={mockDoctor} locale="fa" />);
      expect(html).toContain('href="/fa/doctors/dr-arash-radmanesh"');
      expect(html).toContain("مشاهده نوبت‌ها");
      expect(html).toContain('aria-label="رزرو نوبت حضوری"');
      expect(html).not.toContain("رزرو حضوری (پرداخت در مطب)");
      expect(html).toContain(">calendar_month</span>");
    });

    it("renders fallback stethoscope icon when imageUrl is absent", () => {
      const html = renderToString(
        <DoctorCard doctor={{ id: "doc-102", name: "دکتر مریم امینی" }} locale="fa" />
      );
      expect(html).toContain("دکتر مریم امینی");
      expect(html).toContain(">stethoscope</span>");
    });
  });

  describe("ServiceCard", () => {
    const mockService = {
      id: "srv-201",
      name: "چکاپ جامع متابولیک و قند ناشتا",
      category: "آزمایشگاه بالینی",
      serviceType: "diagnostic",
      providerName: "آزمایشگاه پاتوبیولوژی مرکزی",
      description: "شامل HbA1c، چربی کامل، آنزیم‌های کبد و ارزیابی مقاومت به انسولین.",
      fastingHours: 10,
      durationMinutes: 30,
      price: 480000,
      slug: "metabolic-checkup",
    };

    it("renders service name, category pill, provider name, and description", () => {
      const html = renderToString(<ServiceCard service={mockService} locale="fa" />);
      expect(html).toContain("چکاپ جامع متابولیک و قند ناشتا");
      expect(html).toContain("آزمایشگاه بالینی");
      expect(html).toContain("ارائه‌دهنده: آزمایشگاه پاتوبیولوژی مرکزی");
      expect(html).toContain(
        "شامل HbA1c، چربی کامل، آنزیم‌های کبد و ارزیابی مقاومت به انسولین."
      );
    });

    it("renders fasting warning chip with timer icon and Persian digits", () => {
      const html = renderToString(<ServiceCard service={mockService} locale="fa" />);
      expect(html).toContain("نیازمند ۱۰ ساعت ناشتایی");
      expect(html).toContain(">timer</span>");
    });

    it("renders duration pill with schedule icon and Persian digits", () => {
      const html = renderToString(<ServiceCard service={mockService} locale="fa" />);
      expect(html).toContain("زمان انجام: ۳۰ دقیقه");
      expect(html).toContain(">schedule</span>");
    });

    it("renders approved price display with 'پرداخت حضوری' note", () => {
      const html = renderToString(<ServiceCard service={mockService} locale="fa" />);
      expect(html).toContain("هزینه مصوب:");
      expect(html).toContain("۴۸۰,۰۰۰ تومان");
      expect(html).toContain("پرداخت حضوری");
    });

    it("renders booking CTA button with link to service detail", () => {
      const html = renderToString(<ServiceCard service={mockService} locale="fa" />);
      expect(html).toContain('href="/fa/services/metabolic-checkup"');
      expect(html).toContain("رزرو نوبت آزمایش");
    });

    it("does not render redundant decorative badges like «خدمت تخصصی» or «تاییدیه بالینی»", () => {
      const html = renderToString(<ServiceCard service={mockService} locale="fa" />);
      expect(html).not.toContain("خدمت تخصصی");
      expect(html).not.toContain("خدمت دارای تاییدیه بالینی");
      expect(html).not.toContain("تاییدیه بالینی");
    });

    it("renders 'بدون نیاز به آمادگی خاص' when fastingHours is omitted", () => {
      const noFastingService = {
        id: "srv-202",
        name: "ارزیابی بادی کامپوزیشن (InBody)",
        category: "آنالیز ترکیب بدن",
        durationMinutes: 20,
        price: 190000,
      };
      const html = renderToString(<ServiceCard service={noFastingService} locale="fa" />);
      expect(html).toContain("بدون نیاز به آمادگی خاص");
      expect(html).toContain(">check_circle</span>");
    });
  });

  describe("TrustMetrics", () => {
    it("renders clinical counter badges", () => {
      const html = renderToString(<TrustMetrics />);
      // Counter values & labels
      expect(html).toContain("بیش از ۵۰");
      expect(html).toContain("پزشک متخصص");
      expect(html).toContain("پرداخت مستقیم در مطب");
      expect(html).toContain("پشتیبانی روزانه بیماران");
      expect(html).not.toContain("+۴۵k");
    });

    it("renders 3 trust pillar cards with required headings and descriptions", () => {
      const html = renderToString(<TrustMetrics />);
      expect(html).toContain("حفاظت از پرونده بالینی");
      expect(html).toContain(">shield</span>");
      expect(html).toContain(
        "تمامی اطلاعات آزمایش‌ها، نوبت‌ها و داده‌های غذایی کاربران منطبق با بالاترین استانداردهای محرمانگی رمزنگاری می‌شوند."
      );

      expect(html).toContain("تعرفه مصوب وزارت بهداشت");
      expect(html).toContain(">price_check</span>");
      expect(html).toContain(
        "هزینه کلیه ویزیت‌ها و خدمات پاراکلینیک دقیقاً بر اساس تعرفه مصوب وزارت بهداشت و سازمان نظام پزشکی دریافت می‌شود."
      );

      expect(html).toContain("پشتیبانی اختصاصی بیمار");
      expect(html).toContain(">support_agent</span>");
      expect(html).toContain(
        "تیم پرستاری و پشتیبانی انگبین طب در تمامی مراحل قبل، حین و پس از نوبت در کنار شما پاسخگوی سوالات بالینی است."
      );
    });
  });

  describe("MediaCards", () => {
    describe("ArticleCard", () => {
      const mockArticle = {
        id: "art-301",
        slug: "traditional-rice-calories",
        title: "چگونه کالری پلوهای سنتی (کته، ته‌چین و شویدپلو) را دقیق ثبت کنیم؟",
        summary:
          "بررسی وزن دقیق هر کفگیر استاندارد پلو و محاسبه اثر روغن ته‌دیگ بر گلایسمیک ایندکس غذا.",
        authorName: "دکتر آرش رادمنش",
        readingTimeMinutes: 5,
        category: "کالری‌شماری بومی",
        imageUrl: "https://example.com/rice.jpg",
      };

      it("renders article title, summary, reading time badge, and author name", () => {
        const html = renderToString(<ArticleCard article={mockArticle} locale="fa" />);
        expect(html).toContain(
          "چگونه کالری پلوهای سنتی (کته، ته‌چین و شویدپلو) را دقیق ثبت کنیم؟"
        );
        expect(html).toContain(
          "بررسی وزن دقیق هر کفگیر استاندارد پلو و محاسبه اثر روغن ته‌دیگ بر گلایسمیک ایندکس غذا."
        );
        expect(html).toContain("۵ دقیقه مطالعه");
        expect(html).toContain("دکتر آرش رادمنش");
        expect(html).toContain("کالری‌شماری بومی");
        expect(html).toContain('href="/fa/articles/traditional-rice-calories"');
      });
    });

    describe("VideoCard", () => {
      const mockVideo = {
        id: "vid-401",
        slug: "insulin-resistance-signs",
        title: "نشانه‌های اولیه مقاومت به انسولین چیست؟ راهکارهای مداخله زودهنگام",
        summary: "تحلیل علائم پوستی و خستگی پس از صرف غذا در مصاحبه ویدئویی تخصصی.",
        speakerName: "دکتر لیلا سادات",
        durationMinutes: 12,
        thumbnailUrl: "https://example.com/video-thumb.jpg",
        category: "ویدیو پزشکی",
      };

      it("renders video title, duration badge, speaker name, and play overlay", () => {
        const html = renderToString(<VideoCard video={mockVideo} locale="fa" />);
        expect(html).toContain(
          "نشانه‌های اولیه مقاومت به انسولین چیست؟ راهکارهای مداخله زودهنگام"
        );
        expect(html).toContain("۱۲ دقیقه");
        expect(html).toContain("دکتر لیلا سادات");
        expect(html).toContain(">play_arrow</span>");
        expect(html).toContain("تماشای ویدیو");
        expect(html).toContain('href="/fa/videos/insulin-resistance-signs"');
      });
    });
  });
});
