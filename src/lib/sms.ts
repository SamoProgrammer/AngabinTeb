import "server-only";
// SMS provider selection is explicit: SMS_PROVIDER must be set, always.
//   SMS_PROVIDER=log       -> dev stub, logs to console. Refused in production.
//   SMS_PROVIDER=kavenegar  -> Kavenegar HTTP API (needs SMS_API_KEY, optional SMS_SENDER).
// Anything else (unset, unknown) throws. Never silently logs.

async function sendViaKavenegar(to: string, body: string): Promise<void> {
  const apiKey = process.env.SMS_API_KEY;
  if (!apiKey) throw new Error("SMS_API_KEY not configured for kavenegar provider");
  const params = new URLSearchParams({ receptor: to, message: body });
  const sender = process.env.SMS_SENDER;
  if (sender) params.set("sender", sender);
  const res = await fetch(`https://api.kavenegar.com/v1/${apiKey}/sms/send.json`, {
    method: "POST",
    body: params,
  });
  if (!res.ok) throw new Error(`SMS provider request failed: ${res.status}`);
}

export async function sendSms(to: string, body: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER;
  if (provider === "log") {
    if (process.env.NODE_ENV === "production") {
      throw new Error('SMS_PROVIDER=log is not allowed in production');
    }
    console.log(`[SMS:${to}] ${body}`);
    return;
  }
  if (provider === "kavenegar") {
    await sendViaKavenegar(to, body);
    return;
  }
  throw new Error(
    `SMS_PROVIDER not configured (got ${JSON.stringify(provider ?? null)}): set SMS_PROVIDER=log for development or SMS_PROVIDER=kavenegar for production`,
  );
}
