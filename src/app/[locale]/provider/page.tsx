import { sql, and, eq, gte, lte, gt } from "drizzle-orm";
import { db } from "@/db";
import { availabilitySlots, appointments } from "@/db/schema";
import { requireProvider } from "@/contexts/identity/actions";

export default async function ProviderOverviewPage() {
  const { providerRow } = await requireProvider();
  const now = new Date();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - now.getUTCDay()));
  const weekEnd = new Date(weekStart.getTime() + 7 * 86400_000);
  const [slotsRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(availabilitySlots)
    .where(and(
      eq(availabilitySlots.providerId, providerRow.id),
      gte(availabilitySlots.startsAt, weekStart),
      lte(availabilitySlots.startsAt, weekEnd),
    ));
  const [apptsRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(appointments)
    .innerJoin(availabilitySlots, eq(appointments.slotId, availabilitySlots.id))
    .where(and(
      eq(availabilitySlots.providerId, providerRow.id),
      gt(availabilitySlots.startsAt, now),
    ));
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Overview</h1>
      <div className="flex gap-4">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Slots this week</p>
          <p className="text-2xl font-bold">{slotsRow?.total ?? 0}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Upcoming appointments</p>
          <p className="text-2xl font-bold">{apptsRow?.total ?? 0}</p>
        </div>
      </div>
    </div>
  );
}