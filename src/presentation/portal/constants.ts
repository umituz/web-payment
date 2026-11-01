
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIALING: 'trialing',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
  INCOMPLETE: 'incomplete',
  REVOKED: 'revoked',
} as const;

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  PAID: 'paid',
  VOID: 'void',
  UNCOLLECTIBLE: 'uncollectible',
  REFUNDED: 'refunded',
} as const;

export const CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  TRY: 'TRY',
  JPY: 'JPY',
} as const;

export type Currency = typeof CURRENCY[keyof typeof CURRENCY];

export const PLAN_TYPE = {
  STANDARD: 'standard',
  PRO: 'pro',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise',
} as const;

export const DEFAULT_BILLING_CONFIG = {
  enableYearlyDiscount: true,
  yearlyDiscount: 20,
  currencies: [CURRENCY.USD, CURRENCY.EUR, CURRENCY.GBP] as Currency[],
  defaultCurrency: CURRENCY.USD,
  taxRate: 0,
} as const;
