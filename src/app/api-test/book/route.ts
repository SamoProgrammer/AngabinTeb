import { NextRequest, NextResponse } from "next/server";
import { bookAppointmentWithUser } from "@/contexts/booking/actions";
// ponytail: test-only route, delete when e2e is stable

export async function POST(req: NextRequest) {
  const { slotId } = await req.json();
  const res = await bookAppointmentWithUser(
    { id: "test-patient" },
    { serviceId: "svc-ecg-1", slotId, partySize: 1, idempotencyKey: crypto.randomUUID() },
  );
  return NextResponse.json(res);
}