import { getTranslations } from "next-intl/server";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { saveTopic } from "@/contexts/content/actions";
import { parseListParams, paginate } from "@/components/admin/list-params";
import { AdminToolbar, AdminPagination, AdminEmpty } from "@/components/admin/admin-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FormDrawer } from "@/components/admin/form-drawer";
import { Input } from "@/components/ui/input";
import { PendingAdminButton } from "@/components/clinical/pending-admin-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminTopicsPage({
  params,
  searchParams,
}: {
  params?: Promise<{ locale?: string }>;
  searchParams?: Promise<{ q?: string; page?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tTopics = await getTranslations("admin.topics");
  const tCommon = await getTranslations("admin.common");
  const tSearch = await getTranslations("common");
  const tNav = await getTranslations("admin.nav");
  const tCancel = await getTranslations("common");

  const sp = (await searchParams) ?? {};
  const { q, page } = parseListParams(sp, { tabs: [], defaultTab: "" });

  const rows = await db.select().from(topics).orderBy(topics.name);

  // ponytail: in-page text filter; move to a DB-level filter past ~200 topics.
  const filtered = rows.filter(
    (t) =>
      q === "" ||
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q),
  );
  const { items, totalPages } = paginate(filtered, page);

  const prevLabel = locale === "en" ? "Previous" : locale === "ar" ? "السابق" : "قبلی";
  const nextLabel = locale === "en" ? "Next" : locale === "ar" ? "التالي" : "بعدی";
  const qParam = q === "" ? "" : `&q=${encodeURIComponent(q)}`;

  return (
    <div className="text-start">
      <AdminPageHeader
        crumbs={[{ label: tNav("dashboard"), href: `${prefix}/admin` }, { label: tTopics("title") }]}
        title={tTopics("title")}
        action={
          <FormDrawer
            openLabel={tTopics("createBtn")}
            title={tTopics("title")}
            closeLabel={tCancel("cancel")}
          >
            <form action={async (fd) => { "use server"; await saveTopic(fd); }} className="max-w-xl space-y-4">
              <label className="block space-y-1 text-sm">
                {tCommon("slug")} <Input name="slug" required />
              </label>
              <label className="block space-y-1 text-sm">
                {tTopics("nameFa")} <Input name="name" required />
              </label>
              <PendingAdminButton>{tCommon("create")}</PendingAdminButton>
            </form>
          </FormDrawer>
        }
      />
      <div className="mb-4">
        <AdminToolbar placeholder={tSearch("search")} searchLabel={tCommon("filter")} currentQ={q} />
      </div>
      {items.length === 0 ? (
        <AdminEmpty title={tTopics("title")} />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tCommon("name")}</TableHead>
            <TableHead>{tCommon("slug")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((topicItem) => (
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
      )}
      <div className="mt-4">
        <AdminPagination
          page={page}
          totalPages={totalPages}
          hrefFor={(p) => `?page=${p}${qParam}`}
          prevLabel={prevLabel}
          nextLabel={nextLabel}
        />
      </div>
    </div>
  );
}
