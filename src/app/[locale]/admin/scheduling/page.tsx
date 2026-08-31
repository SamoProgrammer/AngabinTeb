import { db } from "@/db";
import { services, providers } from "@/db/schema";
import { SchedulingForm } from "./scheduling-form";

export default async function AdminSchedulingPage() {
  const [serviceRows, providerRows] = await Promise.all([
    db.select({ id: services.id, name: services.name }).from(services).orderBy(services.name),
    db.select({ id: providers.id, name: providers.name }).from(providers).orderBy(providers.name),
  ]);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Scheduling</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Expand a weekly pattern into concrete availability slots.
      </p>
      <SchedulingForm services={serviceRows} providers={providerRows} />
    </div>
  );
}