import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber as phoneNumberPlugin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendSms } from "@/lib/sms";
import { checkRateLimit, OTP_SEND_RULE } from "@/lib/rate-limit";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "angabin-teb-dev-secret-key-32chars-min!!",
  session: {
    expiresIn: 60 * 60 * 24, // 24h access; Remember-me extends via dontRememberMe flag
    updateAge: 60 * 60 * 12, // sliding refresh: activity after 12h re-issues + extends
  },
  // Explicit so OTP request/verify throttling holds in every env, not just
  // production (better-auth defaults it to enabled ?? isProduction). Covers
  // all /phone-number/* endpoints per IP; verify attempts are additionally
  // capped at 3 per code by the plugin itself.
  rateLimit: { enabled: true },
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "patient", input: false },
    },
  },
  plugins: [
    phoneNumberPlugin({
      sendOTP: async ({ phoneNumber, code }) => {
        // Per-recipient throttle (the plugin's own rule is per IP): caps SMS
        // cost/abuse against one number. Thrown errors surface to the signin
        // page as the endpoint error message.
        const allowed = checkRateLimit(`otp-send:${phoneNumber}`, OTP_SEND_RULE);
        if (!allowed.ok) {
          throw new Error(
            `Too many codes requested. Try again in ${Math.ceil(allowed.retryAfterMs / 1000)} seconds.`,
          );
        }
        await sendSms(phoneNumber, `Angabin Teb: code ${code}`);
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `${phone}@angabinteb.local`,
        getTempName: (phone) => `Patient ${phone.slice(-4)}`,
      },
    }),
  ],
});