import { redirect } from "next/navigation";
import { requireUser } from "@/contexts/identity/actions";
import { createSupportRequest } from "@/contexts/support/actions";
import { myAppointments } from "@/contexts/booking/queries";

const KINDS = ["question", "complaint", "appointment_issue"] as const;
const KIND_TITLES: Record<(typeof KINDS)[number], string> = {
  question: "Ask a question",
  complaint: "Register a complaint",
  appointment_issue: "Report an appointment issue",
};

export default async function NewSupportRequestPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ kind?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { kind, error } = await searchParams;
  const user = await requireUser();
  const kindValue: (typeof KINDS)[number] = KINDS.includes(kind as (typeof KINDS)[number]) ? kind as (typeof KINDS)[number] : "question";
  const appointments = kindValue === "appointment_issue" ? await myAppointments(user.id) : [];

  async function submit(formData: FormData) {
    "use server";
    const result = await createSupportRequest({
      kind: kindValue,
      subject: String(formData.get("subject") ?? ""),
      body: String(formData.get("body") ?? ""),
      appointmentId: formData.get("appointmentId") ? String(formData.get("appointmentId")) : undefined,
    });
    if (!result.ok) redirect(`/${locale}/support/new?kind=${kindValue}&error=${encodeURIComponent(result.error)}`);
    redirect(`/${locale}/support/requests`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-2xl font-bold">{KIND_TITLES[kindValue]}</h1>
      {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <form action={submit} className="mt-6 space-y-4">
        <label className="block space-y-1 text-sm">
          Subject
          <input name="subject" required minLength={3} maxLength={200}
            className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none" />
        </label>
        <label className="block space-y-1 text-sm">
          Message
          <textarea name="body" required minLength={10} maxLength={5000} rows={6}
            className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none" />
        </label>
        {kindValue === "appointment_issue" && (
          <label className="block space-y-1 text-sm">
            Appointment
            <select name="appointmentId" required
              className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 outline-none">
              <option value="">—</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.serviceName} — {new Date(a.startsAt).toLocaleString()}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="submit"
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Submit
        </button>
      </form>
    </main>
  );
}