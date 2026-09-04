import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AdminShell } from "@/components/admin/admin-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
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

describe("Admin Shell Component", () => {
  it("renders clinical sidebar with all navigation links and header", () => {
    const html = renderToString(
      <AdminShell activePath="/admin">
        <div data-testid="admin-content">محتوای مدیریت</div>
      </AdminShell>,
    );

    expect(html).toContain("کنسول مدیریت بالینی");
    expect(html).toContain("انگبین طب");
    expect(html).toContain("داشبورد عملیات");
    expect(html).toContain("پزشکان و ارائه‌دهندگان");
    expect(html).toContain("خدمات و آزمایش‌ها");
    expect(html).toContain("دسته‌بندی خدمات");
    expect(html).toContain("مراکز و کلینیک‌ها");
    expect(html).toContain("زمان‌بندی و اسلات‌ها");
    expect(html).toContain("بانک خوراک‌های ایرانی");
    expect(html).toContain("برنامه‌های تغذیه");
    expect(html).toContain("مدیریت مقالات و مدیا");
    expect(html).toContain("مراکز سلامت ۳۶۰°");
    expect(html).toContain("پشتیبانی و تیکت‌ها");
    expect(html).toContain("تنظیمات سامانه");
    expect(html).toContain("مدیر ارشد سامانه");
    expect(html).toContain("محتوای مدیریت");
  });
});
