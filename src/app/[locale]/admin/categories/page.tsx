import { db } from "@/db";
import { serviceCategories } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminCategoriesPage() {
  const rows = await db.select().from(serviceCategories).orderBy(serviceCategories.name);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button render={<a href="/admin/categories/new" />}>New category</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell><a href={`/admin/categories/${c.id}`} className="font-medium">{c.name}</a></TableCell>
              <TableCell>{c.slug}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}