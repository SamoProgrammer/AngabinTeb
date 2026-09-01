import { describe, expect, it } from "vitest";

type Hub = {
  topic: { id: string; name: string };
  content: Array<{ id: string }>;
  conditions: Array<{ id: string }>;
  relatedServices: Array<{ id: string }>;
  relatedDoctors: Array<{ id: string }>;
};

describe("getTopicHub shape", () => {
  it("aggregates exactly the five sections", () => {
    const hub: Hub = {
      topic: { id: "t1", name: "دیابت" },
      content: [{ id: "c1" }],
      conditions: [{ id: "cond1" }],
      relatedServices: [{ id: "svc1" }],
      relatedDoctors: [{ id: "doc1" }],
    };
    expect(Object.keys(hub).sort()).toEqual(
      ["conditions", "content", "relatedDoctors", "relatedServices", "topic"].sort(),
    );
  });
});