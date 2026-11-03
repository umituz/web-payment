import { describe, it, expect } from 'vitest';
import {
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_VALUES,
  isKnownSubscriptionStatus,
} from '../../src/domain/enums/subscription-status.enum';
import {
  BILLING_CYCLE,
  BILLING_CYCLE_VALUES,
  isKnownBillingCycle,
  parseBillingCycle,
} from '../../src/domain/enums/billing-cycle.enum';
import { POLAR_AMOUNT_TYPE } from '../../src/domain/enums/amount-type.enum';
import {
  PAYMENT_PROVIDER,
  PAYMENT_PROVIDER_VALUES,
  isKnownPaymentProvider,
} from '../../src/domain/enums/payment-provider.enum';

describe('subscription status enum', () => {
  it('exposes the full status set', () => {
    expect(SUBSCRIPTION_STATUS_VALUES).toHaveLength(9);
    expect(SUBSCRIPTION_STATUS.ACTIVE).toBe('active');
    expect(SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED).toBe('incomplete_expired');
    expect(SUBSCRIPTION_STATUS.NONE).toBe('none');
  });

  it('guards known values case-insensitively', () => {
    expect(isKnownSubscriptionStatus('active')).toBe(true);
    expect(isKnownSubscriptionStatus('PAST_DUE')).toBe(true);
    expect(isKnownSubscriptionStatus('unknown-status')).toBe(false);
    expect(isKnownSubscriptionStatus(42)).toBe(false);
    expect(isKnownSubscriptionStatus(null)).toBe(false);
    expect(isKnownSubscriptionStatus(undefined)).toBe(false);
  });
});

describe('billing cycle enum', () => {
  it('only accepts canonical values through the type guard', () => {
    expect(isKnownBillingCycle('monthly')).toBe(true);
    expect(isKnownBillingCycle('YEARLY')).toBe(true);
    expect(isKnownBillingCycle('month')).toBe(false);
    expect(isKnownBillingCycle('year')).toBe(false);
    expect(isKnownBillingCycle('week')).toBe(false);
    expect(isKnownBillingCycle(undefined)).toBe(false);
  });

  it('parses legacy spellings into canonical values', () => {
    expect(parseBillingCycle('month')).toBe(BILLING_CYCLE.MONTHLY);
    expect(parseBillingCycle('Monthly')).toBe(BILLING_CYCLE.MONTHLY);
    expect(parseBillingCycle('year')).toBe(BILLING_CYCLE.YEARLY);
    expect(parseBillingCycle('yearly')).toBe(BILLING_CYCLE.YEARLY);
    expect(parseBillingCycle('weekly')).toBeNull();
    expect(parseBillingCycle(7)).toBeNull();
    expect(parseBillingCycle(null)).toBeNull();
  });

  it('has exactly two canonical values', () => {
    expect(BILLING_CYCLE_VALUES).toEqual(['monthly', 'yearly']);
  });
});

describe('amount type enum', () => {
  it('covers the documented amount types', () => {
    expect(POLAR_AMOUNT_TYPE.FIXED).toBe('fixed');
    expect(POLAR_AMOUNT_TYPE.METERED_UNIT).toBe('metered_unit');
  });
});

describe('payment provider enum', () => {
  it('exposes supported payment providers', () => {
    expect(PAYMENT_PROVIDER_VALUES).toEqual(['polar', 'stripe']);
    expect(PAYMENT_PROVIDER.POLAR).toBe('polar');
    expect(PAYMENT_PROVIDER.STRIPE).toBe('stripe');
  });

  it('validates provider names', () => {
    expect(isKnownPaymentProvider('polar')).toBe(true);
    expect(isKnownPaymentProvider('stripe')).toBe(true);
    expect(isKnownPaymentProvider('paypal')).toBe(false);
    expect(isKnownPaymentProvider('')).toBe(false);
    expect(isKnownPaymentProvider(null)).toBe(false);
  });
});
