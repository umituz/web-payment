export const PAYMENT_PROVIDER = {
  POLAR: 'polar',
  STRIPE: 'stripe',
} as const;

export const PAYMENT_PROVIDER_VALUES = Object.values(PAYMENT_PROVIDER);

export type PaymentProvider = (typeof PAYMENT_PROVIDER)[keyof typeof PAYMENT_PROVIDER];

const PAYMENT_PROVIDER_SET: ReadonlySet<string> = new Set<string>(PAYMENT_PROVIDER_VALUES);

export function isKnownPaymentProvider(value: unknown): value is PaymentProvider {
  return typeof value === 'string' && PAYMENT_PROVIDER_SET.has(value);
}
