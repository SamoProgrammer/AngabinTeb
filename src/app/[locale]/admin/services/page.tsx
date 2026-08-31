import { eq } from "drizzle-orm";
import { db } from "@/db";
import { services, providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminServicesPage() {
  const rows = await db
    .select({ id: services.id, name: services.name, providerName: providers.name, serviceType: services.serviceType, basePrice: services.basePrice })
    .from(services)
    .innerJoin(providers, eq(services.providerId, providers.id))
    .orderBy(services.name);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button render={<a href="/admin/services/new" />}>New service</Button>
      </div>
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