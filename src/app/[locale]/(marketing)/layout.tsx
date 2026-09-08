import type { ReactNode } from "react";

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col"><div className="flex-1">{children}</div></div>;
}
