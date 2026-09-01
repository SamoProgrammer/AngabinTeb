import { db } from "@/db";
import { dietPrograms } from "@/db/schema";
import { createDietProgram } from "@/contexts/nutrition/actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DietProgramForm } from "./diet-program-form";

export default async function AdminDietProgramsPage() {
  const rows = await db.select().from(dietPrograms).orderBy(dietPrograms.name);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Diet programs</h1>
      <Table>
        <TableHeader>
          <TableRow><TableHead>Name</TableHead><TableHead>Context</TableHead><TableHead>Type</TableHead><TableHead>Duration</TableHead><TableHead>Price</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.organizationContext}</TableCell>
              <TableCell>{p.planType}</TableCell>
              <TableCell>{p.durationDays} days</TableCell>
              <TableCell>{p.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <h2 className="mb-4 mt-8 text-lg font-semibold">New diet program</h2>
      <DietProgramForm action={createDietProgram} />
    </div>
  );
}