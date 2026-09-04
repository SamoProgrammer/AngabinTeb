import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";

import AppointmentsPage from "../appointments/page";
import NotificationsPage from "../notifications/page";
import SupportPage from "../../support/page";
import AboutPage from "../../(marketing)/about/page";
import ContactPage from "../../(marketing)/contact/page";

// Mock Identity
vi.mock("@/contexts/identity/actions", () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: "usr-patient-1",
    name: "سارا محمدی‌تبار",
    phone: "09123456789",
    role: "patient",
  }),
}));

// Mock Booking Queries
vi.mock("@/contexts/booking/queries", () => ({
  myAppointments: vi.fn().mockResolvedValue([
    {
      id: "app-1",
      status: "confirmed",
      paymentStatus: "pay_at_clinic",
      partySize: 1,
      price: 4500000,
      serviceName: "ویزیت تخصصی غدد و دیابت",
      startsAt: new Date("2026-09-10T10:00:00Z"),
    },
    {
      id: "app-2",
      status: "cancelled",
      paymentStatus: "pay_at_clinic",
      partySize: 2,
      price: 6000000,
      serviceName: "چکاپ متابولیک و سونوگرافی کبد",
      startsAt: new Date("2026-08-15T14:30:00Z"),
    },
  ]),
}));

// Mock Booking Actions
vi.mock("@/contexts/booking/actions", () => ({
  cancelAppointment: vi.fn().mockResolvedValue({ ok: true }),
}));

// Mock Support Queries
vi.mock("@/contexts/support/queries", () => ({
  listNotifications: vi.fn().mockResolvedValue([
    {
      id: "notif-1",
      userId: "usr-patient-1",
      kind: "appointment",
      title: "تایید نوبت ویزیت تخصصی",
      body: "نوبت شما برای پنج‌شنبه با موفقیت ثبت شد. پرداخت در مطب انجام می‌شود.",
      read: false,
      createdAt: new Date("2026-09-04T09:00:00Z"),
    },
    {
      id: "notif-2",
      userId: "usr-patient-1",
      kind: "reminder",
      title: "یادآوری آزمایش ناشتا",
      body: "لطفاً پیش از مراجعه جهت آزمایش قند ناشتا، ۸ الی ۱۰ ساعت ناشتایی را رعایت فرمایید.",
      read: true,
      createdAt: new Date("2026-09-03T18:00:00Z"),
    },
  ]),
}));

// Mock Support Actions
vi.mock("@/contexts/support/actions", () => ({
  markNotificationsRead: vi.fn().mockResolvedValue({ ok: true }),
}));

describe("Account, Support & Marketing Pages", () => {
  it("renders AppointmentsPage with status badges and details", async () => {
    const pageJsx = await AppointmentsPage({
      params: Promise.resolve({ locale: "fa" }),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("نوبت‌های ویزیت و خدمات درمانی من");
    expect(html).toContain("ویزیت تخصصی غدد و دیابت");
    expect(html).toContain("نوبت تایید شده");
    expect(html).toContain("لغو شده");
    expect(html).toContain("پرداخت در مطب");
    expect(html).toContain("لغو نوبت");
  });

  it("renders NotificationsPage with unread indicators and actions", async () => {
    const pageJsx = await NotificationsPage();
    const html = renderToString(pageJsx);

    expect(html).toContain("اعلان‌ها و یادآوری‌های سلامت");
    expect(html).toContain("تایید نوبت ویزیت تخصصی");
    expect(html).toContain("یادآوری آزمایش ناشتا");
    expect(html).toContain("علامت‌گذاری همه به عنوان خوانده شده");
  });

  it("renders SupportPage with inquiry cards and FAQ shortcuts", async () => {
    const pageJsx = await SupportPage({
      params: Promise.resolve({ locale: "fa" }),
    });
    const html = renderToString(pageJsx);

    expect(html).toContain("مرکز پشتیبانی مراجعین انگبین طب");
    expect(html).toContain("پرسش عمومی و راهنمایی");
    expect(html).toContain("ثبت نظر یا انتقاد");
    expect(html).toContain("پیگیری یا تغییر نوبت");
    expect(html).toContain("مشاهده درخواست‌های من");
  });

  it("renders AboutPage with clinical pillars and advisory board", () => {
    const pageJsx = AboutPage();
    const html = renderToString(pageJsx);

    expect(html).toContain("درباره سامانه جامع سلامت بالینی انگبین طب");
    expect(html).toContain("پزشکی مبتنی بر شواهد بالینی");
    expect(html).toContain("تغذیه اصیل متناسب با سفره ایرانی");
    expect(html).toContain("دکتر لیلا سادات");
    expect(html).toContain("دکتر آرش رادمنش");
  });

  it("renders ContactPage with hotlines and clinic branches", () => {
    const pageJsx = ContactPage();
    const html = renderToString(pageJsx);

    expect(html).toContain("تماس با کلینیک‌ها و پشتیبانی انگبین طب");
    expect(html).toContain("مرکز تماس و پذیرش تلفنی");
    expect(html).toContain("۰۲۱-۸۸۸۸۴۵۶۷");
    expect(html).toContain("کلینیک مرکزی انگبین طب (شعبه ولیعصر)");
    expect(html).toContain("مرکز غرب و پایش متابولیک (شعبه سعادت‌آباد)");
  });
});
