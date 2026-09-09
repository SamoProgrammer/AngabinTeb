"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function LocaleError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
