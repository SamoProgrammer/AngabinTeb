import { describe, test, expect } from "vitest";
import { dietClaims, registrySnapshots } from "@/db/schema/nutrition";

// NOTE: brief's helper used Object.keys(getTableConfig(t).columns), but in
// drizzle-orm 0.45 getTableConfig().columns is an Array (keys "0","1",...),
// so keys are read off the table object itself (JS property names).
const cols = (t: object) => Object.keys(t);

describe("relocation schema", () => {
  test("diet_claim carries org context, paid price, retry counter", () => {
    expect(cols(dietClaims)).toEqual(
      expect.arrayContaining(["organizationContext", "pricePaid", "retryCount"]),
    );
  });
  test("registry_snapshot mirrors the 8 registry sections, one per claim", () => {
    expect(cols(registrySnapshots)).toEqual(
      expect.arrayContaining([
        "claimId", "personInfo", "medicalHistory", "drugHistory",
        "addictionHistory", "nutritionInfo", "cardiovascularQuestions",
        "anthropometric", "medicalDocuments",
      ]),
    );
  });
});
