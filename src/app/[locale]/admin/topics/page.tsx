import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { saveTopic } from "@/contexts/content/actions";
import { Input } from "@/components/ui/input";
import { PendingAdminButton } from "@/components/clinical/pending-admin-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminTopicsPage() {
  const tTopics = await getTranslations("admin.topics");
  const tCommon = await getTranslations("admin.common");

  const rows = await db.select().from(topics).orderBy(topics.name);

  return (
    <div className="text-start">
      <h1 className="mb-6 text-2xl font-bold">{tTopics("title")}</h1>
      <form action={async (fd) => { "use server"; await saveTopic(fd); }} className="mb-8 flex max-w-xl items-end gap-3">
        <label className="block flex-1 space-y-1 text-sm">
          {tCommon("slug")} <Input name="slug" required />
        </label>
        <label className="block flex-1 space-y-1 text-sm">
          {tTopics("nameFa")} <Input name="name" required />
        </label>
        <PendingAdminButton>{tCommon("create")}</PendingAdminButton>
      </form>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("slug")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((topicItem) => (
            <TableRow key={topicItem.id}>
              <TableCell colSpan={2}>
                <form action={async (fd) => { "use server"; await saveTopic(fd); }} className="flex items-end gap-3">
                  <input type="hidden" name="id" value={topicItem.id} />
                  <label className="block flex-1 space-y-1 text-sm">
                    {tCommon("name")} <Input name="name" defaultValue={topicItem.name} required />
                  </label>
                  <label className="block flex-1 space-y-1 text-sm">
                    {tCommon("slug")} <Input name="slug" defaultValue={topicItem.slug} required />
                  </label>
                  <PendingAdminButton variant="outline">{tCommon("save")}</PendingAdminButton>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}