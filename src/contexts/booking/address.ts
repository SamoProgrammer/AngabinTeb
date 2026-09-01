export function normalizeCity(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isServiceable(serviceableCityIds: string[], cityId: string): boolean {
  return serviceableCityIds.includes(cityId);
}