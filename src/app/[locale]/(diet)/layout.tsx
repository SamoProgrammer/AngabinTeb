import type { ReactNode } from "react";

// Public wizard group: same container as the account layout, but WITHOUT
// requireUser — wizard steps 1-3 are browsable by guests; payment/check
// walls handle auth themselves.
export default function DietLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>;
}
