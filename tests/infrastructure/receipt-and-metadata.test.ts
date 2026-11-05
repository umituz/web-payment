import { describe, it, expect } from 'vitest';
import { formatReceiptNumber } from '../../src/infrastructure/utils/receipt.util';
import {
  buildCheckoutMetadata,
  readCheckoutMetadata,
} from '../../src/infrastructure/utils/checkout-metadata';

describe('formatReceiptNumber', () => {
  it('formats standard order ids with RCP prefix by default', () => {
    expect(formatReceiptNumber('ord_12345678abcdef99')).toBe('RCP-ABCDEF99');
    expect(formatReceiptNumber('chk_abcd1234')).toBe('RCP-ABCD1234');
  });

  it('pads short ids with zeros up to 8 characters', () => {
    expect(formatReceiptNumber('abc', 'INV')).toBe('INV-00000ABC');
  });

  it('handles invalid or empty inputs gracefully', () => {
    expect(formatReceiptNumber('', 'RCP')).toBe('RCP-00000000');
    expect(formatReceiptNumber(null as unknown as string, 'RCP')).toBe('RCP-00000000');
  });
});

describe('buildCheckoutMetadata & readCheckoutMetadata', () => {
  const allowed = ['subscription_plan', 'tutoring_booking', 'pass'];

  it('builds and reads back checkout metadata faithfully', () => {
    const raw = buildCheckoutMetadata({
      userId: 'usr_1',
      itemType: 'subscription_plan',
      itemId: 'plus',
      couponCode: 'HANGORA10',
      extra: { tier: 'pro' },
    });

    expect(raw).toEqual({
      userId: 'usr_1',
      itemType: 'subscription_plan',
      itemId: 'plus',
      couponCode: 'HANGORA10',
      tier: 'pro',
    });

    const parsed = readCheckoutMetadata(raw, allowed);
    expect(parsed).toEqual({
      userId: 'usr_1',
      itemType: 'subscription_plan',
      itemId: 'plus',
      couponCode: 'HANGORA10',
    });
  });

  it('trims coupon code and ignores empty or invalid coupon', () => {
    const raw = buildCheckoutMetadata({
      userId: 'usr_2',
      itemType: 'pass',
      itemId: 'pass_10',
      couponCode: '   ',
    });

    expect(raw.couponCode).toBeUndefined();
    const parsed = readCheckoutMetadata(raw, allowed);
    expect(parsed?.couponCode).toBeUndefined();
  });
});
