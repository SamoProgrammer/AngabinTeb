import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AdminShell } from "../admin-shell";
import { AdminPageHeader } from "../admin-page-header";

vi.mock("next/navigation", () => ({ usePathname: () => "/fa/admin/diet-programs/claims" }));
vi.mock("next-intl", () => ({
  useLocale: () => "fa",
  useTranslations: () => (key: string) => key,
}));

describe("AdminShell IA", () => {
  it("links the claims queue and marks it active", () => {
    const html = renderToString(<AdminShell locale="fa" badges={{ claims: 3, support: 1 }}>x</AdminShell>);
    expect(html).toContain("/fa/admin/diet-programs/claims");
    expect(html).toContain("bg-primary text-on-primary");
    expect(html).toContain(">3<");
  });
  it("does not mark diet-programs active on the claims route", () => {
    const html = renderToString(<AdminShell locale="fa">x</AdminShell>);
    const claimsIdx = html.indexOf("/fa/admin/diet-programs/claims");
    const programsIdx = html.indexOf('href="/fa/admin/diet-programs"');
    expect(claimsIdx).toBeGreaterThan(-1);
    expect(programsIdx).toBeGreaterThan(-1);
    const programsActive = html.slice(programsIdx, programsIdx + 400).includes("bg-primary text-on-primary");
    expect(programsActive).toBe(false);
  });
});

describe("AdminPageHeader", () => {
  it("renders breadcrumb trail back to the parent list", () => {
    const html = renderToString(
      <AdminPageHeader
        crumbs={[{ label: "داشبورد", href: "/fa/admin" }, { label: "پشتیبانی" }]}
        title="پشتیبانی"
      />,
    );
    expect(html).toContain('href="/fa/admin"');
    expect(html).toContain("پشتیبانی");
  });
});
