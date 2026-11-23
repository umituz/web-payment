import {
  INVOICE_LINE_KIND,
  type Invoice,
  type InvoiceLine,
  type InvoiceLineKind,
  isKnownInvoiceLineKind,
  isKnownInvoiceStatus,
} from '../entities/invoice.entity';

/** Invoice math (v1.6.0). The totals are DERIVED from the lines in one
 *  place — builders and refunds both route through computeInvoiceTotals,
 *  so a stored subtotal can never disagree with its own lines. Tax is
 *  per-line (integer basis points, rounded), which is what a VAT-style
 *  invoice needs when lines carry different rates. */

export interface InvoiceTotals {
  subtotalMinor: number;
  taxTotalMinor: number;
  totalMinor: number;
}

export function computeInvoiceTotals(lines: readonly InvoiceLine[]): InvoiceTotals {
  let subtotalMinor = 0;
  let taxTotalMinor = 0;
  for (const line of lines) {
    subtotalMinor += line.amountMinor;
    taxTotalMinor += line.taxAmountMinor;
  }
  return { subtotalMinor, taxTotalMinor, totalMinor: subtotalMinor + taxTotalMinor };
}

/** Per-line tax share: basis points of the line amount, rounded to the
 *  minor unit. Integer math end to end — no float drift ever lands in a
 *  stored total. */
export function taxShareOf(amountMinor: number, taxRateBps: number): number {
  // `|| 0` normalizes both -0 (a refund line's zero tax) and any NaN —
  // a poisoned share can never land in a stored total.
  return Math.round((amountMinor * taxRateBps) / 10_000) || 0;
}

export interface MakeInvoiceLineInput {
  id: string;
  description: string;
  quantity?: number;
  unitAmountMinor: number;
  taxRateBps?: number;
  kind?: unknown;
}

export function makeInvoiceLine(input: MakeInvoiceLineInput): InvoiceLine {
  const kind: InvoiceLineKind = isKnownInvoiceLineKind(input.kind) ? input.kind : INVOICE_LINE_KIND.CHARGE;
  const quantity = Number.isFinite(input.quantity) && (input.quantity as number) > 0 ? (input.quantity as number) : 1;
  const taxRateBps =
    Number.isFinite(input.taxRateBps) && (input.taxRateBps as number) >= 0 && (input.taxRateBps as number) <= 10_000
      ? (input.taxRateBps as number)
      : 0;
  // Refunds store a positive unit price and a NEGATIVE derived amount —
  // the sign lives in the kind, the arithmetic stays uniform.
  const gross = quantity * input.unitAmountMinor;
  const amountMinor = kind === INVOICE_LINE_KIND.REFUND ? -gross : gross;
  return {
    id: input.id,
    kind,
    description: input.description,
    quantity,
    unitAmountMinor: input.unitAmountMinor,
    amountMinor,
    taxRateBps,
    taxAmountMinor: taxShareOf(amountMinor, taxRateBps),
  };
}

export interface MakeInvoiceInput extends Omit<Invoice, 'lines' | 'subtotalMinor' | 'taxTotalMinor' | 'totalMinor' | 'status'> {
  lines: InvoiceLine[];
  status?: unknown;
}

export function makeInvoice(input: MakeInvoiceInput): Invoice {
  const totals = computeInvoiceTotals(input.lines);
  return {
    ...input,
    status: isKnownInvoiceStatus(input.status) ? input.status : 'open',
    ...totals,
  };
}

export interface RefundInput {
  id: string;
  amountMinor: number;
  description?: string;
  issuedAt?: string;
}

/** Append a refund line to a PAID invoice and re-derive everything. The
 *  original charge lines stay untouched — the invoice remains the
 *  historical statement, the refund is a new row on it, and the status
 *  says what happened to the money. Refunds carry no tax line: the tax
 *  authority's share is returned inside the refunded amount. */
export function applyRefundToInvoice(invoice: Invoice, refund: RefundInput): Invoice {
  if (invoice.status !== 'paid') {
    throw new Error(`only paid invoices can be refunded (got "${invoice.status}")`);
  }
  if (!Number.isFinite(refund.amountMinor) || refund.amountMinor <= 0) {
    throw new Error('refund amount must be a positive minor-unit number');
  }
  const refundLine = makeInvoiceLine({
    id: refund.id,
    kind: INVOICE_LINE_KIND.REFUND,
    description: refund.description ?? 'Refund',
    unitAmountMinor: refund.amountMinor,
    taxRateBps: 0,
  });
  return {
    ...invoice,
    lines: [...invoice.lines, refundLine],
    ...computeInvoiceTotals([...invoice.lines, refundLine]),
    status: 'refunded',
    metadata: { ...invoice.metadata, refundedAt: refund.issuedAt ?? new Date().toISOString() },
  };
}
