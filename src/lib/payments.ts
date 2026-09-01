import { randomUUID } from "crypto";

// Gateway-agnostic (constraint 9). In production, swap the bodies of
// initiatePayment/verifyPayment for the chosen SDK; nothing else changes.

export async function initiatePayment(
  appointmentId: string,
  _amountToman: string,
): Promise<{ redirectUrl: string }> {
  if (process.env.PAYMENT_GATEWAY) {
    // e.g. gateway.createTransaction({ appointmentId, amountToman })
    throw new Error("PAYMENT_GATEWAY integration not implemented");
  }
  const token = randomUUID();
  return { redirectUrl: `/pay/return?token=${token}&appointment=${appointmentId}` };
}

export async function verifyPayment(token: string): Promise<{ ok: true; paymentId: string } | { ok: false; reason: "invalid" }> {
  if (!token) return { ok: false, reason: "invalid" };
  // Dev: any token with a real appointment id is accepted; production calls the gateway.
  return { ok: true, paymentId: `dev-${token}` };
}