import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  calculateDiscount,
  calculateAnnualSavings,
  calculateDiscountPercent,
  calculateDiscountAmount,
  resolveInvoiceStatusTone,
  resolveInvoiceStatusLabel,
} from '../../src/domain/utils/pricing';

describe('formatPrice', () => {
  it('formats standard minor units for supported currencies', () => {
    expect(formatPrice(1999, 'USD')).toBe('$19.99');
    expect(formatPrice(0, 'USD')).toBe('$0.00');
    expect(formatPrice(10000, 'GBP')).toBe('£100.00');
  });

  it('handles zero decimal currencies without division', () => {
    expect(formatPrice(1500, 'JPY')).toContain('1,500');
    expect(formatPrice(50000, 'KRW')).toContain('50,000');
  });

  it('respects showZeroCents option', () => {
    expect(formatPrice(2000, 'USD', { showZeroCents: false })).toBe('$20');
    expect(formatPrice(2050, 'USD', { showZeroCents: false })).toBe('$20.50');
  });

  it('supports custom locale and digits', () => {
    const formatted = formatPrice(123450, 'EUR', { locale: 'fr-FR' });
    expect(formatted).toContain('1');
    expect(formatted).toContain('€');
  });

  it('falls back safely for unknown currencies', () => {
    const result = formatPrice(5000, 'XYZ');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});

describe('calculateAnnualSavings', () => {
  it('computes annual savings correctly', () => {
    const savings = calculateAnnualSavings(2000, 19200);
    expect(savings.savingsPercent).toBe(20);
    expect(savings.savedMinor).toBe(4800);
    expect(savings.monthlyEquivalentMinor).toBe(1600);
    expect(savings.annualEquivalentMinor).toBe(24000);
  });

  it('returns zero savings when annual price is equal or higher', () => {
    const savings = calculateAnnualSavings(1000, 15000);
    expect(savings.savingsPercent).toBe(0);
    expect(savings.savedMinor).toBe(0);
    expect(savings.monthlyEquivalentMinor).toBe(1250);
  });

  it('handles zero or invalid monthly prices gracefully', () => {
    const savings = calculateAnnualSavings(0, 10000);
    expect(savings.savingsPercent).toBe(0);
    expect(savings.savedMinor).toBe(0);
  });
});

describe('calculateDiscountPercent and calculateDiscountAmount', () => {
  it('computes discount percentage', () => {
    expect(calculateDiscountPercent(100, 80)).toBe(20);
    expect(calculateDiscountPercent(100, 100)).toBe(0);
    expect(calculateDiscountPercent(100, 120)).toBe(0);
    expect(calculateDiscountPercent(0, 50)).toBe(0);
  });

  it('computes discount amount from percentage', () => {
    expect(calculateDiscountAmount(10000, 20)).toBe(2000);
    expect(calculateDiscountAmount(5000, 15)).toBe(750);
    expect(calculateDiscountAmount(5000, 0)).toBe(0);
    expect(calculateDiscountAmount(0, 25)).toBe(0);
  });
});

describe('calculateDiscount legacy helper', () => {
  it('calculates monthly vs yearly discount percentage', () => {
    expect(calculateDiscount(12, 96)).toBe(33);
    expect(calculateDiscount(0, 100)).toBe(0);
    expect(calculateDiscount(10, 240)).toBe(0);
  });
});

describe('resolveInvoiceStatusTone and resolveInvoiceStatusLabel', () => {
  it('resolves correct tones for known statuses', () => {
    expect(resolveInvoiceStatusTone('paid')).toBe('active');
    expect(resolveInvoiceStatusTone('open')).toBe('warning');
    expect(resolveInvoiceStatusTone('draft')).toBe('neutral');
    expect(resolveInvoiceStatusTone('void')).toBe('neutral');
    expect(resolveInvoiceStatusTone('refunded')).toBe('neutral');
    expect(resolveInvoiceStatusTone('uncollectible')).toBe('danger');
    expect(resolveInvoiceStatusTone('unknown')).toBe('neutral');
  });

  it('resolves labels for statuses', () => {
    expect(resolveInvoiceStatusLabel('paid')).toBe('Paid');
    expect(resolveInvoiceStatusLabel('open')).toBe('Open');
    expect(resolveInvoiceStatusLabel('draft')).toBe('Draft');
    expect(resolveInvoiceStatusLabel('refunded')).toBe('Refunded');
    expect(resolveInvoiceStatusLabel('custom_status')).toBe('custom_status');
  });
});
