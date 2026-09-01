import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { services, providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SERVICE_TYPES = ["diagnostic", "therapy", "home_care", "rehab", "ambulance", "consultation"];

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceType?: string }>;
}) {
  const { serviceType } = await searchParams;
  const rows = await db
    .select({ id: services.id, name: services.name, providerName: providers.name, serviceType: services.serviceType, basePrice: services.basePrice })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .where(serviceType && serviceType !== "all" ? and(eq(services.serviceType, serviceType)) : undefined)
    .orderBy(services.name);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button render={<a href="/admin/services/new" />}>New service</Button>
      </div>
      <form className="mb-4 flex items-center gap-2">
        <select
          name="serviceType"
          defaultValue={serviceType ?? "all"}
          className="rounded-md border px-2 py-1"
        >
          <option value="all">All types</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <Button render={<button type="submit" />}>Filter</Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Provider</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((s) => (
            <TableRow key={s.id}>
              <TableCell><a href={`/admin/services/${s.id}`} className="font-medium">{s.name}</a></TableCell>
              <TableCell>{s.providerName}</TableCell>
              <TableCell>{s.serviceType}</TableCell>
              <TableCell>{s.basePrice}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}