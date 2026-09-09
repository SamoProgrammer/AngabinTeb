import { describe, expect, it } from "vitest";
import { feedbackFor } from "@/lib/feedback";

describe("feedbackFor", () => {
  it("maps capacity_exceeded to a warning", () => {
    expect(feedbackFor("capacity_exceeded")).toEqual({
      key: "capacityExceeded",
      tone: "warning",
    });
  });
  it("maps rate_limited to a warning", () => {
    expect(feedbackFor("rate_limited")).toEqual({
      key: "rateLimited",
      tone: "warning",
    });
  });
  it("maps already_claimed to a warning", () => {
    expect(feedbackFor("already_claimed")).toEqual({
      key: "alreadyClaimed",
      tone: "warning",
    });
  });
  it("maps not_cancellable to an error", () => {
    expect(feedbackFor("not_cancellable").tone).toBe("error");
  });
  it("maps generation_failed to an error", () => {
    expect(feedbackFor("generation_failed")).toEqual({
      key: "generationFailed",
      tone: "error",
    });
  });
  it("maps not_found to an error", () => {
    expect(feedbackFor("not_found").tone).toBe("error");
  });
  it("falls back to genericError for unknown reasons", () => {
    expect(feedbackFor("something_weird")).toEqual({
      key: "genericError",
      tone: "error",
    });
  });
  it("falls back to genericError for empty string", () => {
    expect(feedbackFor("").tone).toBe("error");
  });
  it("maps booking validation reasons to errors", () => {
    expect(feedbackFor("invalid_party")).toEqual({ key: "invalidParty", tone: "error" });
    expect(feedbackFor("same_slot")).toEqual({ key: "sameSlot", tone: "error" });
    expect(feedbackFor("invalid_status")).toEqual({ key: "invalidStatus", tone: "error" });
    expect(feedbackFor("bad_status")).toEqual({ key: "invalidStatus", tone: "error" });
  });
  it("maps provider/overlap reasons to genericError", () => {
    expect(feedbackFor("provider_mismatch")).toEqual({ key: "genericError", tone: "error" });
    expect(feedbackFor("overlap")).toEqual({ key: "genericError", tone: "error" });
    expect(feedbackFor("forbidden")).toEqual({ key: "genericError", tone: "error" });
  });
  it("maps not_cancellable to the notCancellable key", () => {
    expect(feedbackFor("not_cancellable")).toEqual({ key: "notCancellable", tone: "error" });
  });
});
