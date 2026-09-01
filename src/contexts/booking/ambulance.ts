export type DispatchStatus = "scheduled" | "en_route" | "completed" | "cancelled";

export function initialDispatchStatus(appointmentStatus: string): DispatchStatus {
  return appointmentStatus === "cancelled" ? "cancelled" : "scheduled";
}