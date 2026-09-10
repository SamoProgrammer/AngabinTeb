"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAdminClaimStatus } from "@/contexts/nutrition/actions";

const TERMINAL = new Set(["ready", "failed", "completed"]);
const POLL_MS = 4000;

// Watches one claim row: polls status until it leaves the transitional set,
// then refreshes the server-rendered row once. Renders nothing.
export default function ClaimPoller({ claimId, status }: { claimId: string; status: string }) {
  const router = useRouter();
  const seen = useRef(status);
  useEffect(() => {
    if (TERMINAL.has(seen.current)) return;
    let alive = true;
    const id = setInterval(async () => {
      try {
        const r = await getAdminClaimStatus(claimId);
        if (!alive || !r.ok) return;
        if (r.status !== seen.current) {
          seen.current = r.status;
          router.refresh();
          if (TERMINAL.has(r.status)) clearInterval(id);
        }
      } catch {
        // Transient poll failure — next tick retries; never kill the loop.
      }
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [claimId, router]);
  return null;
}
