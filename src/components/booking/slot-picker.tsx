"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookAppointment } from "@/contexts/booking/actions";

type SlotProps = { id: string; startsAt: string; capacity: number; bookedCount: number };
type Result = { ok: boolean; appointmentId?: string; reason?: string };
type HomeCareProps = { serviceableCityIds: string[] };

const CITIES = [
  { id: "1", label: "تهران" },
  { id: "2", label: "کرج" },
  { id: "3", label: "اصفهان" },
];

export function SlotPicker({ slots, serviceId, homeCare }: {
  slots: SlotProps[]; serviceId: string; homeCare?: HomeCareProps;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [cityId, setCityId] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (slots.length === 0) return <p className="mt-6 text-gray-500">No availability on this day.</p>;

  async function confirm() {
    if (!selected) return;
    const homeAddress = homeCare
      ? cityId && addressLine.trim() ? { cityId, addressLine: addressLine.trim() } : null
      : undefined;
    if (homeCare && !homeAddress) {
      setError("Please provide your address.");
      return;
    }
    setBusy(true);
    setError(null);
    const key = crypto.randomUUID();
    const res = (await bookAppointment({
      serviceId, slotId: selected, partySize: 1,
      idempotencyKey: key,
      ...(homeAddress ? { homeAddress } : {}),
    })) as Result;
    if (res.ok && res.appointmentId) {
      router.push(`/confirm?id=${res.appointmentId}`);
    } else {
      setError(res.reason === "capacity_exceeded"
        ? "This slot was just taken. Please choose another."
        : res.reason === "not_serviceable"
          ? "This service is not available in your area."
          : res.reason === "address_required"
            ? "Please provide your address."
            : "Booking failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold">Choose a time</h2>
      {homeCare && (
        <div className="mb-6">
          <label className="block" htmlFor="city">City</label>
          <select id="city" name="city" value={cityId} onChange={(e) => setCityId(e.target.value)}
                  className="mb-4 w-full rounded border px-3 py-2">
            <option value="">Select city</option>
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <label className="block" htmlFor="address">Address</label>
          <textarea id="address" name="address" value={addressLine} onChange={(e) => setAddressLine(e.target.value)}
                    rows={3} className="w-full rounded border px-3 py-2" />
        </div>
      )}
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