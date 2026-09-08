import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { services, providers } from "@/db/schema";
import { SchedulingForm } from "./scheduling-form";

export default async function AdminSchedulingPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";

  const tScheduling = await getTranslations("admin.scheduling");

  const [serviceRows, providerRows] = await Promise.all([
    db.select({ id: services.id, name: services.name }).from(services).orderBy(services.name),
    db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name),
  ]);

  return (
    <div className="text-start">
      <h1 className="mb-2 text-2xl font-bold">{tScheduling("title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {tScheduling("subtitle")}
      </p>
      <SchedulingForm services={serviceRows} providers={providerRows} locale={locale} />
    </div>
  );
}