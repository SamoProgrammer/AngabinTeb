"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PendingSubmitProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/**
 * Submit button for native GET filter forms (full-page reload, where
 * useFormStatus never fires). Shows pending from click until the next
 * page unloads. Only use in forms with no required fields — a blocked
 * submit would leave the spinner stuck.
 */
export function PendingSubmit({ children, className, onClick, ...rest }: PendingSubmitProps) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      onClick={(e) => {
        setPending(true);
        onClick?.(e);
      }}
      {...rest}
      className={cn(className, pending && "opacity-70")}
    >
      {pending && (
        <span
          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
