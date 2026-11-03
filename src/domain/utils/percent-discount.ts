
export function normalizeCouponCode(code: unknown): string | null {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function applyPercentDiscount(
  baseAmount: number,
  percent: number,
  minimumAmount: number,
): number {
  if (!Number.isFinite(baseAmount) || baseAmount <= 0) return 0;
  if (!Number.isFinite(percent) || percent <= 0) return Math.round(baseAmount);
  const discounted = Math.round(baseAmount * (1 - percent / 100));
  return Math.max(minimumAmount, discounted);
}
