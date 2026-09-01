import { completePayment } from "@/contexts/booking/payment-actions";

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; appointment?: string }>;
}) {
  const { token, appointment } = await searchParams;
  const result = await completePayment(appointment ?? "", token ?? "");
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">
        {result.ok
          ? "Paid — appointment confirmed"
          : result.reason === "invalid"
            ? "Payment verification failed."
            : "Appointment not found."}
      </h1>
    </main>
  );
}