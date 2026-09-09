"use client";

import { RouteError } from "@/components/clinical/route-error";

export default function AuthError({ reset }: { reset: () => void }) {
  return <RouteError reset={reset} />;
}
