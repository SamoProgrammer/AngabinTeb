export type FeedbackTone = "success" | "warning" | "error";

export interface Feedback {
  key: string;
  tone: FeedbackTone;
}

const WARNINGS: Record<string, string> = {
  capacity_exceeded: "capacityExceeded",
  rate_limited: "rateLimited",
  already_claimed: "alreadyClaimed",
};

const ERRORS: Record<string, string> = {
  invalid_party: "invalidParty",
  not_cancellable: "notCancellable",
  same_slot: "sameSlot",
  not_found: "notFound",
  generation_failed: "generationFailed",
  invalid_status: "invalidStatus",
  provider_mismatch: "genericError",
  overlap: "genericError",
  bad_status: "invalidStatus",
  forbidden: "genericError",
};

export function feedbackFor(reason: string): Feedback {
  if (reason in WARNINGS) return { key: WARNINGS[reason], tone: "warning" };
  if (reason in ERRORS) return { key: ERRORS[reason], tone: "error" };
  return { key: "genericError", tone: "error" };
}
