import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateText } from "ai";
import { generateDietPlan } from "../ai-diet";

vi.mock("server-only", () => ({}));
vi.mock("ai", () => ({ generateText: vi.fn() }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: vi.fn(() => ({ chat: vi.fn() })) }));

const mockedGenerateText = vi.mocked(generateText);

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AI_API_KEY = "test-key";
  delete process.env.AI_BASE_URL;
});

describe("generateDietPlan", () => {
  it("throws on empty model text instead of storing a footer-only document", async () => {
    mockedGenerateText.mockResolvedValue({ text: "   \n" } as never);
    await expect(generateDietPlan("prompt")).rejects.toThrow("empty text");
  });

  it("returns non-empty text untouched", async () => {
    mockedGenerateText.mockResolvedValue({ text: "برنامه روز اول" } as never);
    await expect(generateDietPlan("prompt")).resolves.toBe("برنامه روز اول");
  });
});
