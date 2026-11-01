
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TurnkeyBillingPage } from '../../../src/presentation/portal/TurnkeyBillingPage';
import { NoopNavigationStrategy } from '../../../src/presentation/navigation/navigation.strategy';
import type { BillingAdapter } from '../../../src/domain/interfaces';
import type {
  CancelResult,
  CheckoutResult,
  OrderItem,
  Product,
  SubscriptionStatus,
  SyncResult,
} from '../../../src/domain/entities';

function makeAdapter(overrides: Partial<BillingAdapter> = {}): BillingAdapter {
  return {
    getStatus: vi.fn(async (): Promise<SubscriptionStatus> => ({
      plan: 'plan_pro',
      subscriptionId: 'sub_1',
      subscriptionStatus: 'active',
      cancelAtPeriodEnd: false,
      currentPeriodEnd: '2026-11-01T00:00:00Z',
      billingCycle: 'monthly',
      providerCustomerId: 'cus_1',
    })),
    createCheckout: vi.fn(async (): Promise<CheckoutResult> => ({ url: 'https://polar.sh/checkout/co_1', id: 'co_1' })),
    syncSubscription: vi.fn(async (): Promise<SyncResult> => ({ synced: true })),
    getBillingHistory: vi.fn(async (): Promise<OrderItem[]> => []),
    cancelSubscription: vi.fn(async (): Promise<CancelResult> => ({ success: true })),
    getPortalUrl: vi.fn(async (): Promise<string> => 'https://customer.polar.sh/portal'),
    ...overrides,
  };
}

const PRODUCTS: Product[] = [
  {
    id: 'prod_pro',
    name: 'Professional',
    description: 'Growing teams',
    isRecurring: true,
    recurringInterval: 'monthly',
    isArchived: false,
    organizationId: 'org_1',
    prices: [
      { id: 'price_m', type: 'fixed', amountType: 'fixed', amount: 9900, currency: 'eur', recurringInterval: 'monthly', isArchived: false, productId: 'prod_pro' },
      { id: 'price_y', type: 'fixed', amountType: 'fixed', amount: 95000, currency: 'eur', recurringInterval: 'yearly', isArchived: false, productId: 'prod_pro' },
    ],
    benefits: [],
    metadata: { planId: 'plan_pro' },
    createdAt: '2026-01-01T00:00:00Z',
    modifiedAt: null,
  },
];

function renderPage(adapter: BillingAdapter) {
  return render(
    <TurnkeyBillingPage
      adapter={adapter}
      products={PRODUCTS}
      config={{ brandName: 'Acme', supportEmail: 'billing@acme.test' }}
      navigation={new NoopNavigationStrategy()}
    />,
  );
}

describe('TurnkeyBillingPage', () => {
  it('loads billing on mount without any user interaction', async () => {
    const adapter = makeAdapter();
    renderPage(adapter);

    expect(adapter.getStatus).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Current Subscription')).toBeInTheDocument();
  });

  it('renders prices from minor units (99,00 not 9.900)', async () => {
    renderPage(makeAdapter());

    await screen.findByText('Current Subscription');
    expect(screen.getAllByText(/99[.,]00/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/9\.900/)).toBeNull();
  });

  it('offers retry after a failed initial load and retries the adapter', async () => {
    const adapter = makeAdapter({
      getStatus: vi.fn(async () => {
        throw new Error('Backend down');
      }),
    });
    renderPage(adapter);

    expect(await screen.findByText('Backend down')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(adapter.getStatus).toHaveBeenCalledTimes(2);
  });
});
