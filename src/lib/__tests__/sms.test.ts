import { describe, expect, it, vi } from "vitest";
import { sendSms } from "@/lib/sms";

describe("sendSms", () => {
  it("logs the message in dev", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendSms("09120000000", "Angabin Teb: code 123456");
    expect(spy).toHaveBeenCalledWith("[SMS:09120000000] Angabin Teb: code 123456");
    spy.mockRestore();
  });
});