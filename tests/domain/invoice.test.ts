import { describe, it, expect } from 'vitest';
import {
  makeInvoice,
  makeInvoiceLine,
  computeInvoiceTotals,
  taxShareOf,
  applyRefundToInvoice,
} from '../../src/domain/utils/invoice-totals';
import { INVOICE_STATUS, INVOICE_LINE_KIND, type Invoice } from '../../src/domain/entities/invoice.entity';

describe('invoice entity', () => {
  it('knows its statuses and line kinds', () => {
    expect(INVOICE_STATUS.REFUNDED).toBe('refunded');
    expect(INVOICE_LINE_KIND.REFUND).toBe('refund');
  });
});

describe('makeInvoiceLine', () => {
  it('derives the line amount from quantity × unit', () => {
    const line = makeInvoiceLine({ id: 'l1', description: 'Studio — monthly', quantity: 1, unitAmountMinor: 4900, taxRateBps: 2000 });
    expect(line.amountMinor).toBe(4900);
    expect(line.taxAmountMinor).toBe(980);
    expect(line.kind).toBe('charge');
  });

  it('scales quantity and rounds tax to the minor unit', () => {
    const line = makeInvoiceLine({ id: 'l2', description: 'Seats', quantity: 3, unitAmountMinor: 1500, taxRateBps: 1900 });
    expect(line.amountMinor).toBe(4500);
    expect(line.taxAmountMinor).toBe(Math.round(4500 * 1900 / 10000)); // 855
  });

  it('refund lines carry a negative amount and no tax', () => {
    const line = makeInvoiceLine({ id: 'l3', description: 'Refund', unitAmountMinor: 2000, kind: 'refund' });
    expect(line.amountMinor).toBe(-2000);
    expect(line.taxAmountMinor).toBe(0);
  });

  it('defaults quantity to 1, rejects malformed tax and kind', () => {
    const line = makeInvoiceLine({ id: 'l4', description: 'X', unitAmountMinor: 1000, taxRateBps: -5 as unknown as number, kind: 'mystery' });
    expect(line.quantity).toBe(1);
    expect(line.taxRateBps).toBe(0);
    expect(line.kind).toBe('charge');
  });
});

describe('computeInvoiceTotals / makeInvoice', () => {
  const lines = [
    makeInvoiceLine({ id: 'a', description: 'Plan', unitAmountMinor: 4900, taxRateBps: 2000 }),
    makeInvoiceLine({ id: 'b', description: 'Extra seat', quantity: 2, unitAmountMinor: 900, taxRateBps: 0 }),
  ];

  it('sums per-line amounts and taxes', () => {
    expect(computeInvoiceTotals(lines)).toEqual({ subtotalMinor: 6700, taxTotalMinor: 980, totalMinor: 7680 });
  });

  it('stamps the derived totals onto the invoice and defaults to open', () => {
    const invoice = makeInvoice({
      id: 'inv_1', number: 'INV-2026-001', currency: 'EUR',
      issuedAt: '2026-11-23T10:00:00Z', periodStart: '2026-11-01', periodEnd: '2026-11-30',
      lines,
    });
    expect(invoice.status).toBe('open');
    expect(invoice.subtotalMinor).toBe(6700);
    expect(invoice.taxTotalMinor).toBe(980);
    expect(invoice.totalMinor).toBe(7680);
  });
});

describe('applyRefundToInvoice', () => {
  const paid = (): Invoice => makeInvoice({
    id: 'inv_1', number: 'INV-2026-001', status: 'paid', currency: 'EUR',
    issuedAt: '2026-11-23T10:00:00Z', periodStart: '2026-11-01', periodEnd: '2026-11-30',
    paidAt: '2026-11-23T10:05:00Z',
    lines: [makeInvoiceLine({ id: 'a', description: 'Plan', unitAmountMinor: 4900, taxRateBps: 2000 })],
  });

  it('appends a negative line, re-derives totals, flips status', () => {
    const refunded = applyRefundToInvoice(paid(), { id: 'r1', amountMinor: 1500, description: 'Goodwill', issuedAt: '2026-11-24T09:00:00Z' });
    expect(refunded.status).toBe('refunded');
    expect(refunded.lines).toHaveLength(2);
    expect(refunded.lines[1]!.amountMinor).toBe(-1500);
    expect(refunded.subtotalMinor).toBe(3400);
    expect(refunded.taxTotalMinor).toBe(980); // original charge tax untouched
    expect(refunded.totalMinor).toBe(4380);
    expect(refunded.metadata?.refundedAt).toBe('2026-11-24T09:00:00Z');
  });

  it('keeps the original lines immutable', () => {
    const before = paid();
    applyRefundToInvoice(before, { id: 'r1', amountMinor: 100 });
    expect(before.lines).toHaveLength(1);
    expect(before.status).toBe('paid');
  });

  it('refuses non-paid invoices and non-positive amounts', () => {
    const open = { ...paid(), status: 'open' as const };
    expect(() => applyRefundToInvoice(open, { id: 'r', amountMinor: 100 })).toThrow(/paid/);
    expect(() => applyRefundToInvoice(paid(), { id: 'r', amountMinor: 0 })).toThrow(/positive/);
    expect(() => applyRefundToInvoice(paid(), { id: 'r', amountMinor: -5 })).toThrow(/positive/);
  });
});

describe('taxShareOf', () => {
  it('is integer math end to end', () => {
    expect(taxShareOf(999, 2500)).toBe(250); // rounds 249.75 up
    expect(taxShareOf(1001, 2500)).toBe(250); // rounds 250.25 down
  });
});
