
export const POLAR_AMOUNT_TYPE = Object.freeze({
  FIXED: 'fixed',
  CUSTOM: 'custom',
  FREE: 'free',
  SEAT_BASED: 'seat_based',
  METERED_UNIT: 'metered_unit',
} as const);

export type AmountType = (typeof POLAR_AMOUNT_TYPE)[keyof typeof POLAR_AMOUNT_TYPE];
