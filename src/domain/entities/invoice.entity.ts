import type { BillingCycle } from '../enums/billing-cycle.enum';

/** Invoice status ladder (v1.6.0 — the invoice line-item set). A paid
 *  invoice is the only one a refund can descend from; 'void' is the
 *  pre-charge correction (wrong addressee, duplicate issue). */
export const INVOICE_STATUS = Object.freeze({
  DRAFT: 'draft',
  OPEN: 'open',
  PAID: 'paid',
  REFUNDED: 'refunded',
  VOID: 'void',
} as const);

export const INVOICE_STATUS_VALUES = Object.freeze([
  INVOICE_STATUS.DRAFT,
  INVOICE_STATUS.OPEN,
  INVOICE_STATUS.PAID,
  INVOICE_STATUS.REFUNDED,
  INVOICE_STATUS.VOID,
] as const);

export type InvoiceStatus = (typeof INVOICE_STATUS_VALUES)[number];

const INVOICE_STATUS_SET: ReadonlySet<string> = new Set<string>(INVOICE_STATUS_VALUES);

export function isKnownInvoiceStatus(value: unknown): value is InvoiceStatus {
  return typeof value === 'string' && INVOICE_STATUS_SET.has(value.toLowerCase());
}

/** What a line is for: a plan charge, a refund (negative amount), or an
 *  ad-hoc credit (promotion, support gesture). */
export const INVOICE_LINE_KIND = Object.freeze({
  CHARGE: 'charge',
  REFUND: 'refund',
  CREDIT: 'credit',
} as const);

export const INVOICE_LINE_KIND_VALUES = Object.freeze([
  INVOICE_LINE_KIND.CHARGE,
  INVOICE_LINE_KIND.REFUND,
  INVOICE_LINE_KIND.CREDIT,
] as const);

export type InvoiceLineKind = (typeof INVOICE_LINE_KIND_VALUES)[number];

const INVOICE_LINE_KIND_SET: ReadonlySet<string> = new Set<string>(INVOICE_LINE_KIND_VALUES);

export function isKnownInvoiceLineKind(value: unknown): value is InvoiceLineKind {
  return typeof value === 'string' && INVOICE_LINE_KIND_SET.has(value.toLowerCase());
}

/** One row of an invoice. Amounts are minor units (cents) in the
 *  invoice's currency; tax is basis points (1000 = 10%) so integer math
 *  survives every locale. Refund lines carry NEGATIVE amountMinor — the
 *  totals derive, they are never stored opinions. */
export interface InvoiceLine {
  id: string;
  kind: InvoiceLineKind;
  description: string;
  quantity: number;
  unitAmountMinor: number;
  amountMinor: number;
  taxRateBps: number;
  taxAmountMinor: number;
}

/** A billing period's statement of record. periodStart/periodEnd are the
 *  service window (v1: fixed periods, no proration — honest simple
 *  spans); issuedAt is the document date; providerRef ties the row to
 *  the external provider's invoice/order id when one exists. */
export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  currency: string;
  issuedAt: string;
  periodStart: string;
  periodEnd: string;
  lines: InvoiceLine[];
  subtotalMinor: number;
  taxTotalMinor: number;
  totalMinor: number;
  planKey?: string;
  billingCycle?: BillingCycle;
  subscriptionId?: string;
  providerRef?: string;
  paidAt?: string;
  customerEmail?: string;
  couponCode?: string;
  metadata?: Record<string, string | number | boolean>;
}
