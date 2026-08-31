import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber as phoneNumberPlugin } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendSms } from "@/lib/sms";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "patient", input: false },
    },
  },
  plugins: [
    phoneNumberPlugin({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendSms(phoneNumber, `Angabin Teb: code ${code}`);
      },
    }),
  ],
});