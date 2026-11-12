import { applyPercentDiscount, normalizeCouponCode } from './percent-discount';

export interface CouponCatalogOptions {
  minimumAmount?: number;
}

export interface CouponCatalog {
  codes: readonly string[];
  isValid: (code: unknown) => boolean;
  percentOf: (code: unknown) => number;
  discountedAmount: (baseAmount: number, code: unknown) => number;
}

export function createCouponCatalog(
  percents: Readonly<Record<string, number>>,
  options: CouponCatalogOptions = {},
): CouponCatalog {
  const minimumAmount = options.minimumAmount ?? 0;
  const percentByKey = new Map<string, number>();
  for (const [code, percent] of Object.entries(percents)) {
    if (Number.isFinite(percent) && percent > 0 && percent <= 100) {
      percentByKey.set(code.toUpperCase(), percent);
    }
  }

  return {
    codes: [...percentByKey.keys()],
    isValid: (code) => {
      const normalized = normalizeCouponCode(code);
      return normalized !== null && percentByKey.has(normalized);
    },
    percentOf: (code) => {
      const normalized = normalizeCouponCode(code);
      if (normalized === null) return 0;
      return percentByKey.get(normalized) ?? 0;
    },
    discountedAmount: (baseAmount, code) =>
      applyPercentDiscount(baseAmount, percentByKey.get(normalizeCouponCode(code) ?? '') ?? 0, minimumAmount),
  };
}
