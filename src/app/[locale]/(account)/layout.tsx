import type { ReactNode } from "react";
import { requireUser } from "@/contexts/identity/actions";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireUser(); // server-side, not proxy-only
  return <main className="mx-auto max-w-4xl px-4 py-12">{children}</main>;
}