import { eq } from "drizzle-orm";
import { db } from "@/db";
import { locations, providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminLocationsPage() {
  const rows = await db
    .select({ id: locations.id, label: locations.label, providerName: providers.name, cityId: locations.cityId, phone: locations.phone })
    .from(locations)
    .innerJoin(providers, eq(locations.providerId, providers.id))
    .orderBy(locations.label);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Button render={<a href="/admin/locations/new" />}>New location</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Label</TableHead><TableHead>Provider</TableHead><TableHead>City</TableHead><TableHead>Phone</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((l) => (
            <TableRow key={l.id}>
              <TableCell><a href={`/admin/locations/${l.id}`} className="font-medium">{l.label}</a></TableCell>
              <TableCell>{l.providerName}</TableCell>
              <TableCell>{l.cityId}</TableCell>
              <TableCell>{l.phone ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}