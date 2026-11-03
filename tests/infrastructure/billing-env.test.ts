import { describe, it, expect } from 'vitest';
import {
  parseProductIds,
  productIdOf,
  successUrlWithCheckoutId,
  CHECKOUT_ID_PARAM,
} from '../../src/infrastructure/config/billing-env';
import { readCheckoutMetadata } from '../../src/infrastructure/utils/checkout-metadata';

describe('parseProductIds', () => {
  it('parses a product key to id catalog from env json', () => {
    const ids = parseProductIds('{"plan:plus":"uuid-1","tier:pro_10:monthly":"uuid-2"}');
    expect(productIdOf(ids, 'plan:plus')).toBe('uuid-1');
    expect(productIdOf(ids, 'missing')).toBeNull();
  });

  it('tolerates unset, invalid and partial payloads', () => {
    expect(parseProductIds(undefined).size).toBe(0);
    expect(parseProductIds('not json').size).toBe(0);
    expect(parseProductIds('["array"]').size).toBe(0);
    const ids = parseProductIds('{"ok":"uuid","empty":"","count":3}');
    expect(ids.size).toBe(1);
    expect(productIdOf(ids, 'ok')).toBe('uuid');
  });
});

describe('successUrlWithCheckoutId', () => {
  it('appends the checkout id placeholder', () => {
    expect(successUrlWithCheckoutId('https://app.example', '/app/billing/return')).toBe(
      'https://app.example/app/billing/return?checkout_id={CHECKOUT_ID}',
    );
    expect(successUrlWithCheckoutId('https://app.example', '/return?lang=tr')).toBe(
      'https://app.example/return?lang=tr&checkout_id={CHECKOUT_ID}',
    );
    expect(CHECKOUT_ID_PARAM).toBe('checkout_id');
  });
});

describe('readCheckoutMetadata', () => {
  const itemTypes = ['subscription_plan', 'instructor_tier'];

  it('reads a valid order envelope', () => {
    expect(
      readCheckoutMetadata(
        {
          userId: 'user_1',
          itemType: 'subscription_plan',
          itemId: 'plus',
          couponCode: 'HANGORA10',
        },
        itemTypes,
      ),
    ).toEqual({ userId: 'user_1', itemType: 'subscription_plan', itemId: 'plus', couponCode: 'HANGORA10' });
  });

  it('omits the coupon when absent', () => {
    const meta = readCheckoutMetadata(
      { userId: 'user_1', itemType: 'instructor_tier', itemId: 'pro_10' },
      itemTypes,
    );
    expect(meta).toEqual({ userId: 'user_1', itemType: 'instructor_tier', itemId: 'pro_10' });
    expect(meta?.couponCode).toBeUndefined();
  });

  it('rejects incomplete or unknown-type envelopes', () => {
    expect(readCheckoutMetadata(undefined, itemTypes)).toBeNull();
    expect(readCheckoutMetadata({ userId: 'user_1' }, itemTypes)).toBeNull();
    expect(
      readCheckoutMetadata({ userId: 'user_1', itemType: 'unknown', itemId: 'x' }, itemTypes),
    ).toBeNull();
    expect(
      readCheckoutMetadata({ userId: '', itemType: 'instructor_tier', itemId: 'pro_10' }, itemTypes),
    ).toBeNull();
  });
});
