import { describe, it, expect } from 'vitest';
import { createCouponCatalog } from '../../src/domain/utils/coupon-catalog';

describe('createCouponCatalog', () => {
  const catalog = createCouponCatalog(
    { LAUNCH10: 10, WELCOME20: 20 },
    { minimumAmount: 1 },
  );

  it('lists valid codes', () => {
    expect(catalog.codes).toEqual(['LAUNCH10', 'WELCOME20']);
  });

  it('normalizes codes before lookup', () => {
    expect(catalog.percentOf('  launch10 ')).toBe(10);
    expect(catalog.percentOf('WELCOME20')).toBe(20);
  });

  it('returns zero for unknown or malformed codes', () => {
    expect(catalog.percentOf('NOPE')).toBe(0);
    expect(catalog.percentOf(undefined)).toBe(0);
    expect(catalog.percentOf(42)).toBe(0);
  });

  it('answers validity without applying a discount', () => {
    expect(catalog.isValid('launch10')).toBe(true);
    expect(catalog.isValid('nope')).toBe(false);
    expect(catalog.isValid('   ')).toBe(false);
  });

  it('applies the catalog percent with the configured floor', () => {
    expect(catalog.discountedAmount(20, 'LAUNCH10')).toBe(18);
    expect(catalog.discountedAmount(1, 'WELCOME20')).toBe(1);
    expect(catalog.discountedAmount(15, 'nope')).toBe(15);
  });

  it('drops non-positive and out-of-range percents from the catalog', () => {
    const strict = createCouponCatalog({ ZERO: 0, NEG: -5, BIG: 150, OK: 5 });
    expect(strict.codes).toEqual(['OK']);
    expect(strict.percentOf('BIG')).toBe(0);
    expect(strict.isValid('NEG')).toBe(false);
  });

  it('defaults to a zero floor when no minimum is configured', () => {
    const free = createCouponCatalog({ FULL: 100 });
    expect(free.discountedAmount(20, 'FULL')).toBe(0);
  });
});
