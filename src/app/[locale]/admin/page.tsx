import { count } from "drizzle-orm";
import { db } from "@/db";
import { users, translations } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOverviewPage() {
  const [userCount, translationCount] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(translations),
  ]);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="text-3xl font-bold">{userCount[0].n}</CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Translations</CardTitle></CardHeader>
        <CardContent className="text-3xl font-bold">{translationCount[0].n}</CardContent>
      </Card>
    </div>
  );
}