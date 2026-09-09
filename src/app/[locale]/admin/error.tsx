"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function AdminError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
