import { requireUser } from "@/contexts/identity/actions";
import { providers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";

export default async function ProviderClaimPage() {
  const user = await requireUser();
  const [row] = await db.select().from(providers).where(eq(providers.phone, user.phoneNumber ?? ""));
  if (row) {
    return (
      <div className="mx-auto max-w-md p-8">
        <h1 className="mb-4 text-2xl font-bold">Provider account found</h1>
        <p className="mb-4 text-gray-600">Provider account found: {row.name} — continue to your portal</p>
        <a href="/provider"
          className="inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Go to portal
        </a>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-2xl font-bold">Provider account</h1>
      <p className="text-gray-600">No provider account is linked to this phone number. Contact support.</p>
    </div>
  );
}
