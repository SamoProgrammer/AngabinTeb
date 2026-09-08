import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listContentAdmin } from "@/contexts/content/queries";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const KNOWN_KINDS = ["article", "pamphlet", "faq", "video"] as const;
const KNOWN_STATUSES = ["draft", "published"] as const;

export default async function AdminContentPage({
  params,
}: {
  params?: Promise<{ locale?: string }>;
}) {
  const resolved = params ? await params : {};
  const locale = resolved.locale === "en" || resolved.locale === "ar" ? resolved.locale : "fa";
  const prefix = `/${locale}`;

  const tContent = await getTranslations("admin.content");
  const tCommon = await getTranslations("admin.common");

  const rows = await listContentAdmin();

  return (
    <div className="text-start">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tContent("title")}</h1>
        <Button nativeButton={false} render={<Link href={`${prefix}/admin/content/new`} />}>
          {tContent("newBtn")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tContent("titleFa")}</TableHead>
            <TableHead>{tCommon("kind")}</TableHead>
            <TableHead>{tCommon("status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => {
            const isKnownKind = KNOWN_KINDS.includes(c.kind as (typeof KNOWN_KINDS)[number]);
            const kindLabel = isKnownKind
              ? tContent(`kinds.${c.kind}` as any)
              : c.kind;

            const isKnownStatus = KNOWN_STATUSES.includes(c.status as (typeof KNOWN_STATUSES)[number]);
            const statusLabel = isKnownStatus
              ? tContent(`statuses.${c.status}` as any)
              : c.status;

            return (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`${prefix}/admin/content/${c.id}`} className="font-medium text-primary hover:underline">
                    {c.title}
                  </Link>
                </TableCell>
                <TableCell>{kindLabel}</TableCell>
                <TableCell>{statusLabel}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}