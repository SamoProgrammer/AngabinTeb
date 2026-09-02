"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "@/contexts/booking/actions";

type SlotProps = { id: string; startsAt: string; capacity: number; bookedCount: number };
type Result = { ok: boolean; appointmentId?: string; reason?: string };

export function SlotPicker({ slots, serviceId }: { slots: SlotProps[]; serviceId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (slots.length === 0) return <p className="mt-6 text-gray-500">No availability on this day.</p>;

  async function confirm() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const key = crypto.randomUUID();
    const res = (await bookAppointment({
      serviceId,
      slotId: selected,
      partySize: 1,
      idempotencyKey: key,
    })) as Result;
    if (res.ok && res.appointmentId) {
      router.push(`/confirm?id=${res.appointmentId}`);
    } else {
      setError(
        res.reason === "capacity_exceeded"
          ? "This slot was just taken. Please choose another."
          : "Booking failed. Try again.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold">Choose a time</h2>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((s) => {
          const time = new Date(s.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => setSelected(s.id)}
                aria-pressed={selected === s.id}
                className={`w-full rounded border px-3 py-2 text-sm ${
                  selected === s.id ? "border-emerald-600 bg-emerald-50" : "border-gray-300"
                }`}
              >
                {time}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!selected || busy}
        onClick={confirm}
        className="mt-6 rounded bg-emerald-600 px-6 py-2 text-white disabled:opacity-50"
      >
        {busy ? "Booking…" : "Confirm booking"}
      </button>
    </div>
  );
}