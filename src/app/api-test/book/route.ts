import { NextRequest, NextResponse } from "next/server";
import { bookAppointmentWithUser } from "@/contexts/booking/actions";
// ponytail: test-only route, delete when e2e is stable
// Same opt-in gate as login: on in dev, in prod only with DEMO_LOGIN_ENABLED.
function isDemoLoginEnabled() {
  return process.env.DEMO_LOGIN_ENABLED === "true" || process.env.NODE_ENV !== "production";
}

export async function POST(req: NextRequest) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { slotId } = await req.json();
  const res = await bookAppointmentWithUser(
    { id: "test-patient" },
    { serviceId: "svc-ecg-1", slotId, partySize: 1, idempotencyKey: crypto.randomUUID() },
  );
  return NextResponse.json(res);
}