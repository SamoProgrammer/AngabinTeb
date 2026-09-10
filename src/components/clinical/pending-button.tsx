"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PendingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

/**
 * Submit button for server-action forms. Spins and disables itself while
 * the enclosing form action runs. Must be rendered inside the <form>.
 */
export function PendingButton({ children, className, ...rest }: PendingButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
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
