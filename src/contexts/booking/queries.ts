import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services, availabilitySlots, providers, locations } from "@/db/schema";

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

export async function getAppointment(id: string) {
  const [row] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      partySize: appointments.partySize,
      price: appointments.price,
      serviceName: services.name,
      providerName: providers.name,
      addressLine: locations.addressLine,
      startsAt: availabilitySlots.startsAt,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(providers, eq(appointments.providerId, providers.id))
    .leftJoin(locations, eq(appointments.locationId, locations.id))
    .leftJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(eq(appointments.id, id));
  return row ?? null;
}