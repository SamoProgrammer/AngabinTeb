export async function sendSms(to: string, body: string): Promise<void> {
  if (process.env.NODE_ENV === "production" && !process.env.SMS_PROVIDER) {
    throw new Error("SMS_PROVIDER not configured in production");
  }
  // Dev: log the code so the OTP flow is verifiable without a gateway.
  console.log(`[SMS:${to}] ${body}`);
}