
export const CHECKOUT_ID_PARAM = 'checkout_id';

export const CHECKOUT_ID_PLACEHOLDER = '{CHECKOUT_ID}';

export type ProductIdMap = Map<string, string>;

export function parseProductIds(raw: string | undefined): ProductIdMap {
  const map: ProductIdMap = new Map();
  if (typeof raw !== 'string' || raw.length === 0) return map;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return map;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return map;
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value === 'string' && value.length > 0) map.set(key, value);
  }
  return map;
}

export function productIdOf(ids: ProductIdMap, productKey: string): string | null {
  return ids.get(productKey) ?? null;
}

export function successUrlWithCheckoutId(origin: string, returnPath: string): string {
  const separator = returnPath.includes('?') ? '&' : '?';
  return `${origin}${returnPath}${separator}${CHECKOUT_ID_PARAM}=${CHECKOUT_ID_PLACEHOLDER}`;
}
