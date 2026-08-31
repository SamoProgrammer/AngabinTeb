import type { BookingStatus } from "./kernel";

export type { BookingStatus, SlotView } from "./kernel";

export type AppointmentRow = {
  id: string;
  status: BookingStatus;
  paymentStatus: string;
  partySize: number;
  price: string;
  serviceName: string;
  startsAt: Date;
};