
export interface CheckoutOrderMetadata {
  userId: string;
  itemType: string;
  itemId: string;
  couponCode?: string;
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value;
}

export function readCheckoutMetadata(
  metadata: Record<string, unknown> | undefined,
  allowedItemTypes: readonly string[],
): CheckoutOrderMetadata | null {
  if (metadata === undefined) return null;
  const userId = asNonEmptyString(metadata.userId);
  const itemType = asNonEmptyString(metadata.itemType);
  const itemId = asNonEmptyString(metadata.itemId);
  if (!userId || !itemType || !itemId) return null;
  if (!allowedItemTypes.includes(itemType)) return null;
  const couponCode = asNonEmptyString(metadata.couponCode);
  return { userId, itemType, itemId, ...(couponCode ? { couponCode } : {}) };
}
