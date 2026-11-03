
export interface CheckoutOrderMetadata {
  userId: string;
  itemType: string;
  itemId: string;
  couponCode?: string;
}

export interface BuildCheckoutMetadataInput {
  userId: string;
  itemType: string;
  itemId: string;
  couponCode?: string;
  extra?: Record<string, string>;
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value;
}

export function buildCheckoutMetadata(
  input: BuildCheckoutMetadataInput,
): Record<string, string> {
  const meta: Record<string, string> = {
    userId: input.userId,
    itemType: input.itemType,
    itemId: input.itemId,
  };
  if (input.couponCode && input.couponCode.trim().length > 0) {
    meta.couponCode = input.couponCode.trim();
  }
  if (input.extra) {
    for (const [key, value] of Object.entries(input.extra)) {
      if (typeof value === 'string' && value.length > 0) {
        meta[key] = value;
      }
    }
  }
  return meta;
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
