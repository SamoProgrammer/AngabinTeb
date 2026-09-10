import type { ReactNode } from "react";
import { EmptyState } from "@/components/clinical/empty-state";
import { PendingLink } from "@/components/clinical/pending-link";
import { PendingSubmit } from "@/components/clinical/pending-submit";
import { Input } from "@/components/ui/input";

export interface AdminToolbarProps {
  placeholder: string;
  searchLabel: string;
  currentQ?: string;
  hidden?: Record<string, string>;
  children?: ReactNode;
}

export function AdminToolbar({ placeholder, searchLabel, currentQ = "", hidden, children }: AdminToolbarProps) {
  return (
    <form method="get" role="search" className="flex items-center gap-2">
      {hidden
        ? Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      <Input name="q" defaultValue={currentQ} placeholder={placeholder} className="max-w-xs" />
      {children}
      <PendingSubmit className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold hover:bg-primary-container transition-colors">
        {searchLabel}
      </PendingSubmit>
    </form>
  );
}

export interface AdminPaginationProps {
  page: number;
  totalPages: number;
  hrefFor: (p: number) => string;
  prevLabel?: string;
  nextLabel?: string;
}

export function AdminPagination({
  page,
  totalPages,
  hrefFor,
  prevLabel = "قبلی",
  nextLabel = "بعدی",
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="pagination" className="flex items-center gap-2">
      {page > 1 ? (
        <PendingLink
          href={hrefFor(page - 1)}
          busyLabel={prevLabel}
          className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
        >
          {prevLabel}
        </PendingLink>
      ) : null}
      {page < totalPages ? (
        <PendingLink
          href={hrefFor(page + 1)}
          busyLabel={nextLabel}
          className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs sm:text-sm font-bold text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
        >
          {nextLabel}
        </PendingLink>
      ) : null}
    </nav>
  );
}

export interface AdminEmptyProps {
  title: string;
  hint?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function AdminEmpty(props: AdminEmptyProps) {
  return <EmptyState {...props} />;
}
