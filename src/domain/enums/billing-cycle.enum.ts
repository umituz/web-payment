
export const BILLING_CYCLE = Object.freeze({
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const);

export const BILLING_CYCLE_VALUES = Object.freeze([
  BILLING_CYCLE.MONTHLY,
  BILLING_CYCLE.YEARLY,
] as const);

export type BillingCycle = (typeof BILLING_CYCLE_VALUES)[number];

const CANONICAL_BILLING_CYCLES: ReadonlySet<string> = new Set(BILLING_CYCLE_VALUES);

const BILLING_CYCLE_ALIASES: ReadonlyMap<string, BillingCycle> = new Map([
  [BILLING_CYCLE.MONTHLY, BILLING_CYCLE.MONTHLY],
  ['month', BILLING_CYCLE.MONTHLY],
  [BILLING_CYCLE.YEARLY, BILLING_CYCLE.YEARLY],
  ['year', BILLING_CYCLE.YEARLY],
]);

export function isKnownBillingCycle(value: unknown): value is BillingCycle {
  return typeof value === 'string' && CANONICAL_BILLING_CYCLES.has(value.toLowerCase());
}

export function parseBillingCycle(value: unknown): BillingCycle | null {
  if (typeof value !== 'string') return null;
  return BILLING_CYCLE_ALIASES.get(value.toLowerCase()) ?? null;
}
