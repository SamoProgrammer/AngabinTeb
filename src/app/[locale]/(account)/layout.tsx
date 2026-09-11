// src/app/[locale]/(account)/layout.tsx
import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";
import { UserShell } from "@/components/account/user-shell";
import { myAppointments } from "@/contexts/booking/queries";
import { myDietClaims } from "@/contexts/nutrition/queries";
import { unreadCount } from "@/contexts/support/queries";

export default async function AccountLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const user = await requireUser();
  const { locale } = await params;
  const loc = locale ?? "fa";
  let badges = { reservations: 0, messages: 0, notifications: 0, diets: 0 };
  try {
    const [appts, claims, unread] = await Promise.all([myAppointments(user.id), myDietClaims(user.id, loc), unreadCount(user.id)]);
    badges = {
      reservations: appts.filter((a) => a.status !== "cancelled").length,
      messages: 0,
      notifications: unread,
      diets: claims.filter((c) => c.status === "pending" || c.status === "paid" || c.status === "generating").length,
    };
  } catch { /* degrade to zeros, shell still renders */ }
  return (<UserShell locale={loc} badges={badges}>{children}</UserShell>);
}
