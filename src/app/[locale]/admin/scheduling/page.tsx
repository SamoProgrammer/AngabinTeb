import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { providers } from "@/db/schema";

export default async function AdminSchedulingPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";

  const tScheduling = await getTranslations("admin.scheduling");

  const doctors = await db
    .select({ id: providers.id, name: providers.name })
    .from(providers)
    .orderBy(providers.name);

  return (
    <div className="text-start">
      <h1 className="mb-2 text-2xl font-bold">{tScheduling("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {tScheduling("subtitle")}
      </p>
      <ul className="flex flex-col gap-2">
        {doctors.map((d) => (
          <li key={d.id}>
            <Link
              href={`/${locale}/admin/providers/${d.id}?tab=slots`}
              className="block rounded-xl bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface shadow-tier-1 transition-colors hover:bg-surface-container"
            >
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
