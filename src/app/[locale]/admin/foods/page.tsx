import { db } from "@/db";
import { foods } from "@/db/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminFoodsPage() {
  const rows = await db.select().from(foods).orderBy(foods.name);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Foods</h1>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Source</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((f) => (
            <TableRow key={f.id}>
              <TableCell><a href={`/admin/foods/${f.id}`} className="font-medium">{f.name}</a></TableCell>
              <TableCell>{f.category}</TableCell>
              <TableCell>{f.source}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}