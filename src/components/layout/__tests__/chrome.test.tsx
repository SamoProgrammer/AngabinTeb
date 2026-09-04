import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";
import { ClinicalHeader } from "../clinical-header";
import { ClinicalFooter } from "../clinical-footer";
import { MobileNav } from "../mobile-nav";

// Mock Next.js navigation and next-intl for SSR in Node environment
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

describe("Global Clinical Chrome", () => {
  describe("ClinicalIcon", () => {
    it("renders Material Symbols Outlined glyph correctly", () => {
      const html = renderToString(<ClinicalIcon name="local_hospital" size={24} fill />);
      expect(html).toContain("material-symbols-outlined");
      expect(html).toContain("local_hospital");
      expect(html).toContain("font-variation-settings:&#x27;FILL&#x27; 1");
    });
  });

  describe("ClinicalHeader", () => {
    it("renders brand logo, title, and subtitle", () => {
      const html = renderToString(<ClinicalHeader locale="fa" />);
      expect(html).toContain("انگبین طب");
      expect(html).toContain("سامانه سلامت و تغذیه بالینی");
    });

    it("renders emergency hotline label and link", () => {
      const html = renderToString(<ClinicalHeader locale="fa" />);
      expect(html).toContain("پشتیبانی فوری: ۰۲۱-۸۸۲۲۴۰۰۰");
      expect(html).toContain("tel:02188224000");
    });

    it("renders patient authentication CTA", () => {
      const html = renderToString(<ClinicalHeader locale="fa" />);
      expect(html).toContain("ورود / پرونده من");
      expect(html).toContain("/fa/appointments");
    });

    it("renders all clinical navigation links with tablet breakpoint support", () => {
      const html = renderToString(<ClinicalHeader locale="fa" />);
      expect(html).toContain("نوبت‌دهی پزشکان");
      expect(html).toContain("خدمات درمانی");
      expect(html).toContain("پرونده و تغذیه");
      expect(html).toContain("مجله سلامت");
      expect(html).toContain("درباره ما");
      expect(html).toContain("تماس با ما");
      expect(html).toContain("hidden md:flex");
    });
  });

  describe("ClinicalFooter", () => {
    it("renders emergency disclaimer banner", () => {
      const html = renderToString(<ClinicalFooter locale="fa" />);
      expect(html).toContain("توجه: انگبین طب سامانه اعزام اورژانس پزشکی نیست. در شرایط بحرانی با ۱۱۵ تماس بگیرید.");
    });

    it("renders booking transparency guarantee banner", () => {
      const html = renderToString(<ClinicalFooter locale="fa" />);
      expect(html).toContain("تمامی نوبت‌های پزشکی بدون اخذ کارمزد آنلاین و با پرداخت حضوری در مطب رزرو می‌شوند.");
    });

    it("renders 4-column clinical link sitemap headers", () => {
      const html = renderToString(<ClinicalFooter locale="fa" />);
      expect(html).toContain("دسترسی سریع");
      expect(html).toContain("خدمات بالینی");
      expect(html).toContain("پایگاه دانش و مقالات");
      expect(html).toContain("مجوزها و اعتبارسنجی");
    });

    it("renders emergency numbers and copyright notice", () => {
      const html = renderToString(<ClinicalFooter locale="fa" />);
      expect(html).toContain("شماره تماس اورژانس کشور: ۱۱۵");
      expect(html).toContain("پشتیبانی سامانه: ۰۲۱-۸۸۲۲۴۰۰۰");
      expect(html).toContain("تمامی حقوق این سامانه متعلق به انگبین طب است");
    });

    it("includes mobile navigation clearance padding", () => {
      const html = renderToString(<ClinicalFooter locale="fa" />);
      expect(html).toContain("pb-16 md:pb-0");
    });
  });

  describe("MobileNav", () => {
    it("renders all 5 mobile navigation destinations with valid Material Symbols glyphs", () => {
      const html = renderToString(<MobileNav locale="fa" />);
      expect(html).toContain("خانه");
      expect(html).toContain("پزشکان");
      expect(html).toContain("تغذیه");
      expect(html).toContain("نوبت‌ها");
      expect(html).toContain("پشتیبانی");

      // Verify Material Symbol glyphs: uses valid 'restaurant' glyph and not fallback 'nutrition'
      expect(html).toContain(">restaurant</span>");
      expect(html).not.toContain(">nutrition</span>");
    });

    it("links to correct localized routes", () => {
      const html = renderToString(<MobileNav locale="fa" />);
      expect(html).toContain('href="/fa"');
      expect(html).toContain('href="/fa/doctors"');
      expect(html).toContain('href="/fa/nutrition"');
      expect(html).toContain('href="/fa/appointments"');
      expect(html).toContain('href="/fa/support"');
    });
  });
});
