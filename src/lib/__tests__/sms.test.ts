import { describe, expect, it, vi, afterEach } from "vitest";
import { sendSms } from "@/lib/sms";

const OLD_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...OLD_ENV };
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sendSms", () => {
  it("logs the message when SMS_PROVIDER=log", async () => {
    process.env.SMS_PROVIDER = "log";
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendSms("09120000000", "Angabin Teb: code 123456");
    expect(spy).toHaveBeenCalledWith("[SMS:09120000000] Angabin Teb: code 123456");
  });

  it("throws when SMS_PROVIDER is missing instead of silently logging", async () => {
    delete process.env.SMS_PROVIDER;
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(sendSms("09120000000", "code")).rejects.toThrow("SMS_PROVIDER not configured");
    expect(spy).not.toHaveBeenCalled();
  });

  it("throws on an unknown provider", async () => {
    process.env.SMS_PROVIDER = "carrier-pigeon";
    await expect(sendSms("09120000000", "code")).rejects.toThrow("SMS_PROVIDER not configured");
  });

  it("refuses the log stub in production", async () => {
    process.env.SMS_PROVIDER = "log";
    vi.stubEnv("NODE_ENV", "production");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(sendSms("09120000000", "code")).rejects.toThrow("not allowed in production");
    expect(spy).not.toHaveBeenCalled();
  });

  it("calls kavenegar when SMS_PROVIDER=kavenegar", async () => {
    process.env.SMS_PROVIDER = "kavenegar";
    process.env.SMS_API_KEY = "test-key";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await sendSms("09120000000", "Angabin Teb: code 123456");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("api.kavenegar.com/v1/test-key/sms/send.json");
    expect(init.method).toBe("POST");
    expect(String(init.body)).toContain("09120000000");
  });

  it("throws when kavenegar is selected without an API key", async () => {
    process.env.SMS_PROVIDER = "kavenegar";
    delete process.env.SMS_API_KEY;
    await expect(sendSms("09120000000", "code")).rejects.toThrow("SMS_API_KEY");
  });
});
