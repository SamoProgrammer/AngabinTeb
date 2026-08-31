import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services, availabilitySlots } from "@/db/schema";

export async function myAppointments(userId: string) {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      partySize: appointments.partySize,
      price: appointments.price,
      serviceName: services.name,
      startsAt: availabilitySlots.startsAt,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(eq(appointments.patientId, userId))
    .orderBy(desc(availabilitySlots.startsAt))
    .limit(50);
}