
export function normalizeUserId(userId: string | undefined): string | undefined {
  if (typeof userId !== 'string') return undefined;
  const trimmed = userId.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function isValidProductId(productId: unknown): productId is string {
  return typeof productId === 'string' && productId.trim().length > 0;
}
