import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export interface AdminPageHeaderProps {
  crumbs: Crumb[];
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AdminPageHeader({ crumbs, title, subtitle, action }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <nav aria-label="breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-on-surface-variant">
            {crumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-outline">
                    /
                  </span>
                ) : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-semibold text-on-surface">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-2 text-xl sm:text-2xl font-extrabold text-on-surface">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
