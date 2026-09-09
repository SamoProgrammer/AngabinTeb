import "server-only";
import { cache } from "react";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services, availabilitySlots, providers, locations } from "@/db/schema";

export const myAppointments = cache(async (userId: string) => {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      partySize: appointments.partySize,
      price: appointments.price,
      patientName: appointments.patientName,
      patientPhone: appointments.patientPhone,
      serviceName: services.name,
      startsAt: availabilitySlots.startsAt,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(eq(appointments.patientId, userId))
    .orderBy(desc(availabilitySlots.startsAt))
    .limit(50);
});

export const getMyAppointment = cache(async (userId: string, id: string) => {
  const [row] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      partySize: appointments.partySize,
      price: appointments.price,
      patientName: appointments.patientName,
      patientPhone: appointments.patientPhone,
      serviceId: appointments.serviceId,
      slotId: appointments.slotId,
      serviceName: services.name,
      startsAt: availabilitySlots.startsAt,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(and(eq(appointments.id, id), eq(appointments.patientId, userId)));
  return row ?? null;
});

export const getSlot = cache(async (slotId: string) => {
  const [row] = await db
    .select({
      id: availabilitySlots.id,
      serviceId: availabilitySlots.serviceId,
      startsAt: availabilitySlots.startsAt,
      capacity: availabilitySlots.capacity,
      bookedCount: availabilitySlots.bookedCount,
      isActive: availabilitySlots.isActive,
    })
    .from(availabilitySlots)
    .where(eq(availabilitySlots.id, slotId));
  return row ?? null;
});

export const getAppointment = cache(async (id: string) => {
  const [row] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      paymentStatus: appointments.paymentStatus,
      partySize: appointments.partySize,
      price: appointments.price,
      patientName: appointments.patientName,
      patientPhone: appointments.patientPhone,
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
});

export const listBookingsForDoctor = cache(async (providerId: string, status?: string, page = 1, pageSize = 50) => {
  return db
    .select({
      id: appointments.id,
      status: appointments.status,
      partySize: appointments.partySize,
      price: appointments.price,
      patientName: appointments.patientName,
      patientPhone: appointments.patientPhone,
      serviceName: services.name,
      startsAt: availabilitySlots.startsAt,
    })
    .from(appointments)
    .innerJoin(services, eq(appointments.serviceId, services.id))
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(and(
      eq(appointments.providerId, providerId),
      status ? eq(appointments.status, status) : undefined,
    ))
    .orderBy(desc(availabilitySlots.startsAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
});