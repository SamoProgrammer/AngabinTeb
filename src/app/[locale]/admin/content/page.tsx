import { listContentAdmin } from "@/contexts/content/queries";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminContentPage() {
  const rows = await listContentAdmin();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content</h1>
        <Button render={<a href="/admin/content/new" />}>New content</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Title</TableHead><TableHead>Kind</TableHead><TableHead>Status</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell><a href={`/admin/content/${c.id}`} className="font-medium">{c.title}</a></TableCell>
              <TableCell>{c.kind}</TableCell>
              <TableCell>{c.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}