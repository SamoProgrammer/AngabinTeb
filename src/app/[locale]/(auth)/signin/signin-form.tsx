"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { safeReturnOrDefault } from "@/contexts/identity/return";
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  CircleAlert,
  CircleCheckBig,
  Hospital,
  Lock,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export function SignInForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();

  const rawReturnUrl = searchParams.get("returnUrl") || searchParams.get("callbackUrl");
  const returnUrl = safeReturnOrDefault(rawReturnUrl, locale);

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDemoPending, setIsDemoPending] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Normalize Iranian phone number (converts Persian/Arabic numerals to ASCII, trims)
  function normalizePhone(input: string): string {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    let out = input.trim();
    for (let i = 0; i < 10; i++) {
      out = out.replaceAll(persianDigits[i], String(i)).replaceAll(arabicDigits[i], String(i));
    }
    return out.replace(/\s+/g, "");
  }

  // Handle Step 1: Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = normalizePhone(phoneNumber);
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setErrorMessage(t("invalidPhone"));
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await authClient.phoneNumber.sendOtp({
          phoneNumber: cleanPhone,
        });

        if (error) {
          setErrorMessage(error.message || t("authError"));
          toast.error(error.message || t("authError"), { duration: 4000 });
          return;
        }

        setPhoneNumber(cleanPhone);
        setStep("otp");
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : t("authError"));
        toast.error(err instanceof Error ? err.message : t("authError"), { duration: 4000 });
      }
    });
  }

  // Handle Step 2: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = normalizePhone(otpCode);
    if (cleanCode.length !== 6) {
      setErrorMessage(t("invalidOtp"));
      return;
    }

    startTransition(async () => {
      try {
        const { error } = await authClient.phoneNumber.verify({
          phoneNumber,
          code: cleanCode,
          rememberMe,
        });

        if (error) {
          setErrorMessage(error.message || t("authError"));
          toast.error(error.message || t("authError"), { duration: 4000 });
          return;
        }

        // Successfully verified and session cookie created
        window.location.href = returnUrl;
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : t("authError"));
        toast.error(err instanceof Error ? err.message : t("authError"), { duration: 4000 });
      }
    });
  }

  // Quick Demo Login for developers and test patients
  async function handleDemoLogin(requestedRole: "patient" | "admin" = "patient") {
    setIsDemoPending(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api-test/login?role=${requestedRole}`, { method: "POST" });
      if (!res.ok) throw new Error("Demo login endpoint unavailable");
      // Session cookie arrives via HttpOnly Set-Cookie; never mirror into document.cookie.
      const target =
        requestedRole === "admin" && !returnUrl.startsWith(`/${locale}/admin`)
          ? `/${locale}/admin`
          : returnUrl;
      window.location.href = target;
    } catch {
      setErrorMessage(t("demoError"));
      toast.error(t("demoError"), { duration: 4000 });
      setIsDemoPending(false);
    }
  }

  const isEn = locale === "en";

  return (
    <div
      dir={isEn ? "ltr" : "rtl"}
      className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-surface-container-low/30"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Sign-in Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 sm:p-10 shadow-tier-2 transition-all">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <Link
              href={`/${locale}`}
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-tier-1 hover:scale-105 transition-transform"
            >
              <Hospital size={32} fill="currentColor" aria-hidden="true" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              {t("signin")}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              {step === "phone" ? t("subtitle") : t("otpSentTo", { phone: phoneNumber })}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-6 p-3.5 rounded-2xl bg-error-container/40 border border-error/30 text-error text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <CircleAlert size={18} fill="currentColor" className="shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form Step 1: Mobile Phone Number */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="mt-8 space-y-5">
              <div className="space-y-2 text-start">
                <label
                  htmlFor="phone-input"
                  className="block text-xs sm:text-sm font-semibold text-on-surface"
                >
                  {t("phone")}
                </label>
                <div className="relative rounded-2xl border border-outline-variant/60 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-on-surface-variant">
                    <Smartphone size={20} aria-hidden="true" />
                  </div>
                  <input
                    id="phone-input"
                    type="tel"
                    dir="ltr"
                    autoComplete="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t("phonePlaceholder")}
                    className="w-full bg-transparent py-3 ps-11 pe-4 text-sm font-semibold tracking-wider text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant/80 ps-1">
                  {t("phoneExample")}
                </p>
              </div>

              <button
                type="submit"
                disabled={isPending || !phoneNumber.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 px-4 text-sm font-bold text-on-primary shadow-tier-1 hover:bg-primary-container active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    <span>{t("sendingOtp")}</span>
                  </>
                ) : (
                  <>
                    <span>{t("sendOtp")}</span>
                    {isEn ? (
                      <ArrowRight size={16} aria-hidden="true" />
                    ) : (
                      <ArrowLeft size={16} aria-hidden="true" />
                    )}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form Step 2: Verification OTP Code */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5">
              <div className="space-y-2 text-start">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="otp-input"
                    className="block text-xs sm:text-sm font-semibold text-on-surface"
                  >
                    {t("enterOtp")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtpCode("");
                      setErrorMessage(null);
                    }}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {t("changePhone")}
                  </button>
                </div>

                <div className="relative rounded-2xl border border-outline-variant/60 bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-on-surface-variant">
                    <Lock size={20} aria-hidden="true" />
                  </div>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-transparent py-3 ps-11 pe-4 text-center text-lg font-bold tracking-[0.5em] text-on-surface placeholder:text-outline focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || otpCode.trim().length !== 6}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 px-4 text-sm font-bold text-on-primary shadow-tier-1 hover:bg-primary-container active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    <span>{t("verifying")}</span>
                  </>
                ) : (
                  <>
                    <CircleCheckBig size={18} fill="currentColor" aria-hidden="true" />
                    <span>{t("verifyOtp")}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleSendOtp}
                  className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                >
                  {t("resendOtp")}
                </button>
              </div>
            </form>
          )}

          {/* Remember me */}
          <label
            htmlFor="remember-me"
            className="mt-5 flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-on-surface cursor-pointer"
          >
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            <span>{t("rememberMe")}</span>
          </label>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-container-lowest px-3 text-on-surface-variant">
                {t("demoLogin")}
              </span>
            </div>
          </div>

          {/* Quick Demo Login Option */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              disabled={isDemoPending}
              onClick={() => handleDemoLogin("patient")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-secondary/40 bg-secondary/10 py-2.5 px-3 text-xs font-bold text-secondary hover:bg-secondary/20 transition-all cursor-pointer disabled:opacity-60"
            >
              <Atom size={16} aria-hidden="true" />
              <span>{isDemoPending ? t("demoLoggingIn") : t("demoPatient")}</span>
            </button>
            <button
              type="button"
              disabled={isDemoPending}
              onClick={() => handleDemoLogin("admin")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl border border-primary/40 bg-primary/10 py-2.5 px-3 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-60"
            >
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{isDemoPending ? t("demoLoggingIn") : t("demoAdmin")}</span>
            </button>
          </div>

          {/* Terms notice */}
          <p className="mt-6 text-center text-[11px] text-on-surface-variant/70 leading-relaxed">
            {t("termsAgree")}
          </p>
        </div>

        {/* Back to home link */}
        <div className="text-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            {isEn ? (
              <ArrowLeft size={16} aria-hidden="true" />
            ) : (
              <ArrowRight size={16} aria-hidden="true" />
            )}
            <span>{t("backToHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SignInFallback() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <span className="h-8 w-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export function SignInSuspense({ locale }: { locale: string }) {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInForm locale={locale} />
    </Suspense>
  );
}
