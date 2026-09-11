import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { USER_NAV_GROUPS, UserShell, matchesUserItem } from "../user-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/fa/profile/diets/abc" }));
vi.mock("next-intl", () => ({
  useLocale: () => "fa",
  useTranslations: () => (key: string) => key,
}));

describe("user shell nav", () => {
  it("parents notifications under messages group", () => {
    expect(matchesUserItem("/notifications", "/fa/notifications")).toBe(true);
  });
  it("longest-href-wins: diets/[id] lights diets not dashboard", () => {
    const active = USER_NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => "/fa/profile/diets/abc".startsWith(`/fa${i.href}`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href;
    expect(active).toBe("/profile/diets");
  });
  it("marks diets active with badge and leaves dashboard idle", () => {
    const html = renderToString(<UserShell locale="fa" badges={{ diets: 2 }}>x</UserShell>);
    expect(html).toContain("/fa/profile/diets");
    expect(html).toContain(">2<");
    const anchorFor = (label: string) => {
      const labelIdx = html.indexOf(`>${label}<`);
      expect(labelIdx).toBeGreaterThan(-1);
      return html.slice(html.lastIndexOf("<a", labelIdx), labelIdx);
    };
    const dietsAnchor = anchorFor("diets");
    expect(dietsAnchor).toContain('href="/fa/profile/diets"');
    expect(dietsAnchor.includes("bg-primary text-on-primary")).toBe(true);
    const dashAnchor = anchorFor("dashboard");
    expect(dashAnchor).toContain('href="/fa/profile"');
    expect(dashAnchor.includes("bg-primary text-on-primary")).toBe(false);
  });
});
