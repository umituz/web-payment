import { describe, it, expect } from 'vitest';
import {
  minorUnitDivisor,
  toMajorUnits,
  toMinorUnits,
} from '../../src/domain/utils/minor-units';
import {
  applyPercentDiscount,
  normalizeCouponCode,
} from '../../src/domain/utils/percent-discount';

describe('minor units', () => {
  it('converts usd amounts to cents and back', () => {
    expect(toMinorUnits(19.99, 'usd')).toBe(1999);
    expect(toMajorUnits(1999, 'usd')).toBeCloseTo(19.99);
    expect(minorUnitDivisor('krw')).toBe(1);
    expect(toMinorUnits(1500, 'krw')).toBe(1500);
  });

  it('rounds fractional minor units', () => {
    expect(toMinorUnits(10.005, 'usd')).toBe(1001);
  });
});

describe('percent discount', () => {
  it('normalizes coupon codes', () => {
    expect(normalizeCouponCode('  hangora10 ')).toBe('HANGORA10');
    expect(normalizeCouponCode(undefined)).toBeNull();
    expect(normalizeCouponCode('   ')).toBeNull();
  });

  it('applies a percent discount with a floor', () => {
    expect(applyPercentDiscount(20, 10, 1)).toBe(18);
    expect(applyPercentDiscount(1, 50, 1)).toBe(1);
    expect(applyPercentDiscount(15, 33, 1)).toBe(10);
  });

  it('returns the rounded base when there is no discount', () => {
    expect(applyPercentDiscount(15, 0, 1)).toBe(15);
    expect(applyPercentDiscount(15.4, 0, 1)).toBe(15);
  });

  it('returns zero for non-positive bases', () => {
    expect(applyPercentDiscount(0, 10, 1)).toBe(0);
    expect(applyPercentDiscount(-5, 10, 1)).toBe(0);
  });
});
