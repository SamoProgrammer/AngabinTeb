"use client";

import Link, { useLinkStatus } from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

function LinkVeil({ label }: { label?: string }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-surface-container-lowest/60"
    >
      <span
        className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"
        aria-hidden="true"
      />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}

type PendingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  /** Accessible loading text announced while navigating. */
  busyLabel?: string;
};

/**
 * Next Link with navigation feedback. Shows a spinner veil over the link
 * while the transition runs. Safe for card and inline links alike — the
 * veil is absolutely positioned, so children layout is untouched.
 */
export function PendingLink({ children, className, busyLabel, ...rest }: PendingLinkProps) {
  return (
    <Link {...rest} className={cn("relative", className)}>
      {children}
      <LinkVeil label={busyLabel} />
    </Link>
  );
}
