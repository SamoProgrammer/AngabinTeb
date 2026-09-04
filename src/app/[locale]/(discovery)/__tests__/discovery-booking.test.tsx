import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";

import DoctorsPage from "../doctors/page";
import DoctorPage from "../doctors/[slug]/page";
import ServicesPage from "../services/page";
import ServicePage from "../services/[slug]/page";
import BookPage from "../../(booking)/services/[slug]/book/page";
import ConfirmPage from "../../(booking)/confirm/page";
import SearchPage from "../search/page";

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
  getTranslations: () =>
    Promise.resolve((key: string) => {
      const map: Record<string, string> = {
        placeholder: "جستجو در خدمات و پزشکان",
        submit: "جستجو",
        empty: "نتیجه‌ای یافت نشد",
      };
      return map[key] || key;
    }),
}));

vi.mock("@/contexts/catalog/queries", () => ({
  listDoctors: vi.fn().mockResolvedValue([
    {
      id: "doc-1",
      name: "دکتر مریم شریفی",
      specialty: "فوق تخصص غدد و متابولیسم",
      cityId: "tehran",
      imageUrl: "/images/doc1.jpg",
    },
  ]),
  getDoctor: vi.fn().mockResolvedValue({
    id: "doc-1",
    name: "دکتر مریم شریفی",
    specialtyName: "فوق تخصص غدد و متابولیسم",
    bio: "عضو هیئت علمی دانشگاه علوم پزشکی با ۱۵ سال سابقه طبابت در حوزه دیابت و بیماری‌های متابولیک",
    licenseNumber: "۱۲۳۴۵",
    experienceYears: 15,
    rating: 4.9,
    reviewCount: 128,
  }),
  listServices: vi.fn().mockResolvedValue([
    {
      id: "svc-1",
      name: "آزمایش قند خون و HbA1c",
      providerName: "آزمایشگاه پاتوبیولوژی مرکزی",
      serviceType: "diagnostic",
      cityId: "tehran",
      price: "180000",
    },
  ]),
  getService: vi.fn().mockResolvedValue({
    id: "svc-1",
    name: "نوار قلب (ECG)",
    providerName: "کلینیک قلب و عروق",
    serviceType: "diagnostic",
    priceToman: 150000,
    durationMinutes: 20,
    preparationTimeMinutes: 10,
    description: "ثبت دقیق فعالیت الکتریکی قلب",
  }),
  getPrepInfo: vi.fn().mockResolvedValue({
    fastingRequired: true,
    fastingHours: 8,
    waterIntakeAllowed: true,
    medicationAllowed: false,
    specialInstructions: "لطفاً ناشتا مراجعه فرمایید.",
  }),
  searchAll: vi.fn().mockImplementation((term: string) => {
    if (term.includes("ناموجود")) return Promise.resolve([]);
    return Promise.resolve([
      {
        type: "doctor",
        id: "doc-1",
        title: "دکتر مریم شریفی",
        subtitle: "فوق تخصص غدد و متابولیسم",
        href: "/doctors/doc-1",
      },
      {
        type: "service",
        id: "svc-1",
        title: "نوار قلب (ECG)",
        subtitle: "کلینیک تخصصی قلب",
        href: "/services/svc-1",
      },
    ]);
  }),
}));

vi.mock("@/contexts/booking/queries", () => ({
  getAppointment: vi.fn().mockResolvedValue({
    id: "apt-123456",
    status: "confirmed",
    paymentStatus: "pay_at_clinic",
    partySize: 1,
    price: "150000",
    serviceName: "نوار قلب (ECG)",
    providerName: "دکتر مریم شریفی",
    addressLine: "تهران، خیابان ولیعصر، پلاک ۱۰۰",
    startsAt: new Date("2026-09-15T10:30:00Z"),
  }),
}));

vi.mock("@/contexts/catalog/actions", () => ({
  availabilityForService: vi.fn().mockResolvedValue([
    {
      id: "slot-1",
      startsAt: new Date("2026-09-15T09:00:00Z"),
      capacity: 3,
      bookedCount: 1,
    },
    {
      id: "slot-2",
      startsAt: new Date("2026-09-15T10:00:00Z"),
      capacity: 2,
      bookedCount: 2,
    },
  ]),
}));

describe("Discovery & Booking Subsystem Overhaul (Task 6)", () => {
  describe("1. Doctors Directory (Screen #7)", () => {
    it("renders clinical hero banner, specialty filters, doctor cards, and triage hotline", async () => {
      const jsx = await DoctorsPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({}),
      });
      const html = renderToString(jsx);

      // Hero banner
      expect(html).toContain("نوبت‌دهی آنلاین پزشکان و متخصصان");
      expect(html).toContain("بدون هزینه کارمزد آنلاین");

      // Specialty filter pills
      expect(html).toContain("غدد و متابولیسم");
      expect(html).toContain("تغذیه و رژیم‌درمانی");

      // Doctor card rendered
      expect(html).toContain("دکتر مریم شریفی");

      // Triage hotline banner
      expect(html).toContain("به راهنمایی برای انتخاب پزشک مناسب نیاز دارید؟");
    });
  });

  describe("2. Doctor Dossier Profile (Screen #37)", () => {
    it("renders physician profile hero, council license, bio, and pay-at-clinic booking card", async () => {
      const jsx = await DoctorPage({
        params: Promise.resolve({ locale: "fa", slug: "doc-1" }),
      });
      const html = renderToString(jsx);

      // Breadcrumb navigation
      expect(html).toContain("خانه");
      expect(html).toContain("پزشکان");

      // Physician hero
      expect(html).toContain("دکتر مریم شریفی");
      expect(html).toContain("فوق تخصص غدد و متابولیسم");
      expect(html).toContain("شماره نظام پزشکی");

      // Sticky booking card with zero online fee guarantee
      expect(html).toContain("رزرو حضوری نوبت");
      expect(html).toContain("پرداخت در مطب");
    });
  });

  describe("3. Services Directory (Screen #39)", () => {
    it("renders paraclinical services hero, category tabs, service cards, and diagnostic pathway", async () => {
      const jsx = await ServicesPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({}),
      });
      const html = renderToString(jsx);

      // Paraclinical header
      expect(html).toContain("خدمات پاراکلینیک، آزمایشگاه و سنجش بالینی");
      expect(html).toContain("تعرفه رسمی");

      // Service card
      expect(html).toContain("آزمایش قند خون و HbA1c");

      // Diagnostic pathway steps
      expect(html).toContain("چگونه نوبت خدمت پاراکلینیک خود را نهایی کنیم؟");
      expect(html).toContain("انتخاب خدمت و تاریخ");
      expect(html).toContain("مراجعه و پرداخت در محل");
    });
  });

  describe("4. Service Detail & Preparation (Screen #3)", () => {
    it("renders service details, Preparation warning box, and Book this service CTA", async () => {
      const jsx = await ServicePage({
        params: Promise.resolve({ locale: "fa", slug: "svc-1" }),
      });
      const html = renderToString(jsx);

      // Service name and provider
      expect(html).toContain("نوار قلب (ECG)");
      expect(html).toContain("کلینیک قلب و عروق");

      // Playwright journey requirement: "Preparation"
      expect(html).toContain("Preparation");

      // Playwright journey requirement: "Book this service"
      expect(html).toContain("Book this service");

      // Pay-at-clinic notice
      expect(html).toContain("پرداخت در مطب");
    });
  });

  describe("5. Slot Booking Page (Screen #8)", () => {
    it("renders service summary, #date input, and slot picker with capacity chips", async () => {
      const jsx = await BookPage({
        params: Promise.resolve({ locale: "fa", slug: "svc-1" }),
        searchParams: Promise.resolve({ date: "2026-09-15" }),
      });
      const html = renderToString(jsx);

      // Service summary
      expect(html).toContain("نوار قلب (ECG)");

      // Date input matching Playwright journey locator `#date`
      expect(html).toContain('id="date"');

      // Pay-at-clinic notice
      expect(html).toContain("پرداخت در محل مطب");
      expect(html).toContain("بدون کارمزد آنلاین");

      // Button matching Playwright journey `/Confirm booking/`
      expect(html).toContain("Confirm booking");
    });
  });

  describe("6. Digital Appointment Receipt (Screen #20)", () => {
    it("renders success checkmark, tracking code, appointment details, and pay-at-clinic notice", async () => {
      const jsx = await ConfirmPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ id: "apt-123456" }),
      });
      const html = renderToString(jsx);

      // Success confirmation header
      expect(html).toContain("نوبت بالینی شما با موفقیت ثبت شد");
      expect(html).toContain("پیامک تایید حاوی اطلاعات نوبت برای شما ارسال گردید");

      // Tracking code box
      expect(html).toContain("کد پیگیری پذیرش");
      expect(html).toContain("AT-APT-12");

      // Doctor/Service info
      expect(html).toContain("دکتر مریم شریفی");
      expect(html).toContain("نوار قلب (ECG)");

      // Arrival notice
      expect(html).toContain("۱۵ دقیقه پیش از ساعت مقرر");

      // Pay-at-clinic guarantee
      expect(html).toContain("پرداخت حضوری در محل کلینیک");

      // Action buttons
      expect(html).toContain("چاپ یا دریافت فیش نوبت (PDF)");
      expect(html).toContain("مشاهده در پرونده من");
    });
  });

  describe("7. Universal Faceted Search (Screen #21)", () => {
    it("renders search bar, category tabs, sidebar filters, and faceted result items", async () => {
      const jsx = await SearchPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ q: "قلب" }),
      });
      const html = renderToString(jsx);

      // Search Hero
      expect(html).toContain("جستجوی یکپارچه سلامت و درمان");
      expect(html).toContain('name="q"');

      // Category tabs
      expect(html).toContain("پزشکان");
      expect(html).toContain("خدمات درمانی");

      // Clinical filter sidebar
      expect(html).toContain("فیلترهای بالینی");
      expect(html).toContain("حوزه تخصصی پزشک");
      expect(html).toContain("اطمینان از نظارت بالینی");

      // Results items
      expect(html).toContain("دکتر مریم شریفی");
      expect(html).toContain("نوار قلب (ECG)");
    });

    it("renders empty state with clinical suggestions when no results found", async () => {
      const jsx = await SearchPage({
        params: Promise.resolve({ locale: "fa" }),
        searchParams: Promise.resolve({ q: "واژه_ناموجود_در_پایگاه_داده" }),
      });
      const html = renderToString(jsx);

      // Suggestions
      expect(html).toContain("کبد چرب");
      expect(html).toContain("دیابت");
      expect(html).toContain("InBody");
    });
  });
});
