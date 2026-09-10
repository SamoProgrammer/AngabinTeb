"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/**
 * shadcn-styled submit for server-action forms in admin. Spins and disables
 * itself while the enclosing form action runs. For useActionState forms the
 * same hook fires — no isPending plumbing needed at call sites.
 */
export function PendingAdminButton({ children, ...rest }: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...rest}>
      {pending && (
        <span
          className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </Button>
  );
}
