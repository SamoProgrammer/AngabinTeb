import { db } from "@/db";
import { providers } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminProvidersPage() {
  const rows = await db.select().from(providers).orderBy(providers.name);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Providers</h1>
        <Button render={<a href="/admin/providers/new" />}>New provider</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Kind</TableHead><TableHead>Phone</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell><a href={`/admin/providers/${p.id}`} className="font-medium">{p.name}</a></TableCell>
              <TableCell>{p.kind}</TableCell>
              <TableCell>{p.phone ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}