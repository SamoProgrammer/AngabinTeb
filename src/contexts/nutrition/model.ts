export type { ActivityLevel, RequirementRow } from "./kernel";

export type FoodOption = { id: string; name: string; servingUnits: Array<{ id: string; name: string }> };
export type FoodCard = { id: string; name: string; category: string };
export type FoodDetail = {
  id: string;
  name: string;
  category: string;
  servingUnits: Array<{ id: string; name: string; gramsEquivalent: string }>;
  nutrients: Array<{ nutrientId: string; name: string; unit: string; amountPer100g: string }>;
};
export type IntakeRow = { id: string; foodId: string; foodName: string; servingUnitName: string; quantity: string; loggedAt: Date };
export type DayTotals = Record<string, number>;
export type ProgramCard = {
  id: string;
  name: string;
  description: string | null;
  organizationContext: string;
  planType: string;
  durationDays: number;
  price: string;
  practitionerName: string | null;
  practitionerPhone: string | null;
};
export type ProgramContent = ProgramCard & {
  hasClaim: boolean;
  // Priced program with no claim row: content page shows the denial, not the file.
  accessDenied: boolean;
  // Populated only when the claim gate passes; never leaks to unclaimed callers.
  downloadUrl: string | null;
};