export type { ActivityLevel, RequirementRow } from "./kernel";

export type FoodOption = { id: string; name: string; servingUnits: Array<{ id: string; name: string }> };
export type FoodCard = { id: string; name: string; category: string };
export type IntakeRow = { id: string; foodId: string; foodName: string; servingUnitName: string; quantity: string; loggedAt: Date };
export type DayTotals = Record<string, number>;