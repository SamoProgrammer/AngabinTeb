"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function ContentError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
