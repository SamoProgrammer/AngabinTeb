import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";
import SignInPage from "../page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      signin: "ورود به سامانه",
      subtitle: "شماره همراه خود را وارد کنید",
      phone: "شماره تلفن همراه",
      phonePlaceholder: "۰۹۱۲۳۴۵۶۷۸۹",
      sendOtp: "دریافت کد تأیید",
      demoLogin: "ورود سریع با حساب تستی",
      termsAgree: "ورود به منزله پذیرش قوانین است.",
      backToHome: "بازگشت به صفحه اصلی",
    };
    return map[key] || key;
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    phoneNumber: {
      sendOtp: vi.fn(),
      verify: vi.fn(),
    },
  },
}));

describe("SignInPage", () => {
  it("renders brand heading and phone number form in initial state", async () => {
    const html = renderToString(
      await SignInPage({ params: { locale: "fa" }, searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain("ورود به سامانه");
    expect(html).toContain("شماره تلفن همراه");
    expect(html).toContain("دریافت کد تأیید");
    expect(html).toContain("ورود سریع با حساب تستی");
    expect(html).toContain("بازگشت به صفحه اصلی");
  });

  it("sets ltr direction when locale is en", async () => {
    const html = renderToString(
      await SignInPage({ params: { locale: "en" }, searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain("dir=\"ltr\"");
    expect(html).toContain('href="/en"');
  });
});
