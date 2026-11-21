import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { TurnkeyBillingReturnPage } from '../../../src/presentation/portal/TurnkeyBillingReturnPage';
import type { BillingAdapter } from '../../../src/domain/interfaces';
import type { NavigationStrategy } from '../../../src/presentation/navigation/navigation.strategy';
import type {
  CancelResult,
  CheckoutResult,
  OrderItem,
  SubscriptionStatus,
  SyncResult,
} from '../../../src/domain/entities';

function makeAdapter(overrides: Partial<BillingAdapter> = {}): BillingAdapter {
  return {
    getStatus: vi.fn(async (): Promise<SubscriptionStatus> => ({
      plan: 'free',
      subscriptionStatus: 'none',
      cancelAtPeriodEnd: false,
      billingCycle: 'monthly',
    })),
    createCheckout: vi.fn(async (): Promise<CheckoutResult> => ({ url: 'https://polar.sh/checkout/1', id: '1' })),
    syncSubscription: vi.fn(async (): Promise<SyncResult> => ({ synced: true, plan: 'pro' })),
    getBillingHistory: vi.fn(async (): Promise<OrderItem[]> => []),
    cancelSubscription: vi.fn(async (): Promise<CancelResult> => ({ success: true })),
    getPortalUrl: vi.fn(async (): Promise<string> => 'https://customer.polar.sh/portal'),
    ...overrides,
  };
}

describe('TurnkeyBillingReturnPage', () => {
  it('syncs subscription and redirects to returnUrl', async () => {
    const adapter = makeAdapter();
    const redirectMock = vi.fn();
    const nav: NavigationStrategy = { redirect: redirectMock };
    const onSuccess = vi.fn();

    render(
      <TurnkeyBillingReturnPage
        adapter={adapter}
        userId="user_123"
        returnUrl="/billing"
        navigation={nav}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => {
      expect(adapter.syncSubscription).toHaveBeenCalledWith('user_123', undefined);
      expect(onSuccess).toHaveBeenCalled();
      expect(redirectMock).toHaveBeenCalledWith('/billing');
    });
  });

  it('handles sync error and redirects to returnUrl while notifying onError', async () => {
    const adapter = makeAdapter({
      syncSubscription: vi.fn(async () => {
        throw new Error('Sync failed');
      }),
    });
    const redirectMock = vi.fn();
    const nav: NavigationStrategy = { redirect: redirectMock };
    const onError = vi.fn();

    render(
      <TurnkeyBillingReturnPage
        adapter={adapter}
        userId="user_123"
        returnUrl="/settings"
        navigation={nav}
        onError={onError}
      />,
    );

    await waitFor(() => {
      expect(adapter.syncSubscription).toHaveBeenCalledWith('user_123', undefined);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(redirectMock).toHaveBeenCalledWith('/settings');
    });
  });
});
