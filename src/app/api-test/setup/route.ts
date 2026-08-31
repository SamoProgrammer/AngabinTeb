import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { availabilitySlots } from "@/db/schema";
// ponytail: test-only route, delete when e2e is stable

export async function POST() {
  await db.execute(sql`DELETE FROM appointment WHERE patient_id = 'test-patient'`);
  await db.execute(sql`DELETE FROM availability_slot WHERE id IN ('slot-test-1','slot-test-2')`);
  const tomorrow = new Date(Date.now() + 86400_000);
  const day = Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate());
  const slot1 = new Date(day + 18 * 3_600_000);
  const slot2 = new Date(day + 19 * 3_600_000);
  await db.insert(availabilitySlots).values([
    {
      id: "slot-test-1", providerId: "prov-heart-1", serviceId: "svc-ecg-1",
      startsAt: slot1, endsAt: new Date(slot1.getTime() + 30 * 60_000), capacity: 1,
    },
    {
      id: "slot-test-2", providerId: "prov-heart-1", serviceId: "svc-ecg-1",
      startsAt: slot2, endsAt: new Date(slot2.getTime() + 30 * 60_000), capacity: 1,
    },
  ]);
  return NextResponse.json({ slotId1: "slot-test-1", slotId2: "slot-test-2" });
}