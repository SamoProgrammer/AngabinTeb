import Link from "next/link";
import { ClinicalIcon } from "@/components/clinical/clinical-icon";

interface StateProps {
  title: string;
  hint?: string;
  actionHref?: string;
  actionLabel?: string;
}

function StateShell({
  icon,
  title,
  hint,
  actionHref,
  actionLabel,
  tone,
}: StateProps & { icon: string; tone: "empty" | "error" }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-tier-1 border border-outline-variant/30 p-10 flex flex-col items-center gap-3 text-center">
      <span
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
          tone === "error" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
        }`}
      >
        <ClinicalIcon name={icon} size={30} />
      </span>
      <h2 className="text-base sm:text-lg font-bold text-on-surface">{title}</h2>
      {hint && (
        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-md">
          {hint}
        </p>
      )}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-1 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs sm:text-sm font-bold transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function EmptyState(props: StateProps) {
  return <StateShell {...props} icon="inbox" tone="empty" />;
}

export function ErrorState(props: StateProps) {
  return <StateShell {...props} icon="error" tone="error" />;
}
