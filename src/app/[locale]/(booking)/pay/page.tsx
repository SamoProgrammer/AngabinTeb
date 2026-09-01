import { redirect } from "next/navigation";
import { startPayment } from "@/contexts/booking/payment-actions";

export default async function PayPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string; error?: string }>;
}) {
  const { appointment, error } = await searchParams;
  if (!appointment) return <p>Appointment not found.</p>;

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Pay online</h1>
      {error === "not_found" && <p className="mt-4 text-gray-600">Appointment not found.</p>}
      {error === "already_paid" && <p className="mt-4 text-gray-600">This appointment is already paid.</p>}
      {!error && (
        <form action={async () => {
          "use server";
          const res = await startPayment(appointment);
          if (res.ok) redirect(res.redirectUrl);
          redirect(`/pay?appointment=${appointment}&error=${res.reason}`);
        }}>
          <button type="submit"
            className="mt-8 rounded bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700">
            Pay online
          </button>
        </form>
      )}
    </main>
  );
}