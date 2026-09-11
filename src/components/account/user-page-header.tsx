import Link from "next/link";
export function UserPageHeader({ locale, title, subtitle, action }: { locale: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6 text-start">
      <div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant mb-1">
          <Link href={`/${locale}`} className="hover:text-primary transition-colors">Home</Link>
          <span className="opacity-40">/</span>
          <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">Dashboard</Link>
          <span className="opacity-40">/</span>
          <span className="text-on-surface font-bold">{title}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface">{title}</h1>
        {subtitle ? <p className="text-xs sm:text-sm text-on-surface-variant mt-1">{subtitle}</p> : null}
      </div>
      {action ? <div className="self-start sm:self-auto">{action}</div> : null}
    </div>
  );
}
