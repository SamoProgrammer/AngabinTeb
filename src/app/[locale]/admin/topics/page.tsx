import { db } from "@/db";
import { topics } from "@/db/schema";
import { saveTopic } from "@/contexts/content/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminTopicsPage() {
  const rows = await db.select().from(topics).orderBy(topics.name);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Topics</h1>
      <form action={async (fd) => { await saveTopic(fd); }} className="mb-8 flex max-w-xl items-end gap-3">
        <label className="block flex-1 space-y-1 text-sm">
          Slug <Input name="slug" required />
        </label>
        <label className="block flex-1 space-y-1 text-sm">
          Name (Persian) <Input name="name" required />
        </label>
        <Button type="submit">Create</Button>
      </form>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Slug</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.id}>
              <TableCell colSpan={2}>
                <form action={async (fd) => { await saveTopic(fd); }} className="flex items-end gap-3">
                  <input type="hidden" name="id" value={t.id} />
                  <label className="block flex-1 space-y-1 text-sm">
                    Name <Input name="name" defaultValue={t.name} required />
                  </label>
                  <label className="block flex-1 space-y-1 text-sm">
                    Slug <Input name="slug" defaultValue={t.slug} required />
                  </label>
                  <Button type="submit" variant="outline">Save</Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}