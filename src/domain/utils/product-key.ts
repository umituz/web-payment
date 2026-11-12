export interface ParsedProductKey {
  prefix: string;
  id: string;
  variant?: string;
}

function isValidSegment(segment: string | undefined): segment is string {
  return typeof segment === 'string' && segment.length > 0 && !/\s/.test(segment);
}

export function parseProductKey(key: string): ParsedProductKey | null {
  if (typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed.length === 0) return null;
  const segments = trimmed.split(':');
  if (segments.length < 2 || segments.length > 3) return null;
  const [prefix, id, variant] = segments;
  if (!isValidSegment(prefix) || !isValidSegment(id)) return null;
  if (variant !== undefined && !isValidSegment(variant)) return null;
  return { prefix, id, ...(variant !== undefined ? { variant } : {}) };
}

export function buildProductKey(prefix: string, id: string, variant?: string): string {
  return [prefix, id, ...(variant !== undefined ? [variant] : [])].join(':');
}

export function productKeyPrefix(key: string): string | null {
  return parseProductKey(key)?.prefix ?? null;
}
