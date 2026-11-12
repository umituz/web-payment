import { describe, it, expect } from 'vitest';
import {
  isActiveLifecycle,
  isTerminalLifecycle,
  normalizeSubscriptionLifecycle,
} from '../../src/domain/utils/subscription-lifecycle';

describe('normalizeSubscriptionLifecycle', () => {
  it('keeps a valid lifecycle intact', () => {
    expect(
      normalizeSubscriptionLifecycle({
        status: 'active',
        subscriptionId: 'sub_1',
        renewsAt: '2026-12-01T00:00:00.000Z',
      }),
    ).toEqual({ status: 'active', subscriptionId: 'sub_1', renewsAt: '2026-12-01T00:00:00.000Z' });
  });

  it('degrades unknown or missing input to none', () => {
    expect(normalizeSubscriptionLifecycle(undefined)).toEqual({ status: 'none' });
    expect(normalizeSubscriptionLifecycle(null)).toEqual({ status: 'none' });
    expect(normalizeSubscriptionLifecycle('active')).toEqual({ status: 'none' });
    expect(normalizeSubscriptionLifecycle({ status: 'bogus' })).toEqual({ status: 'none' });
    expect(normalizeSubscriptionLifecycle({ status: 7, subscriptionId: 9 })).toEqual({
      status: 'none',
    });
  });

  it('drops non-string optional fields', () => {
    expect(
      normalizeSubscriptionLifecycle({ status: 'canceled', subscriptionId: 12, renewsAt: true }),
    ).toEqual({ status: 'canceled' });
  });
});

describe('lifecycle predicates', () => {
  it('classifies active and terminal states', () => {
    expect(isActiveLifecycle({ status: 'active' })).toBe(true);
    expect(isActiveLifecycle({ status: 'none' })).toBe(false);
    expect(isTerminalLifecycle({ status: 'canceled' })).toBe(true);
    expect(isTerminalLifecycle({ status: 'revoked' })).toBe(true);
    expect(isTerminalLifecycle({ status: 'active' })).toBe(false);
  });
});
