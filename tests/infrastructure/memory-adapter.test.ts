import { describe, it, expect, vi } from 'vitest';
import { createMemoryBillingAdapter } from '../../src/infrastructure/services/memory/create-memory-adapter';

describe('createMemoryBillingAdapter', () => {
  it('starts with default inactive free status', async () => {
    const adapter = createMemoryBillingAdapter();
    const status = await adapter.getStatus('user_1');
    expect(status.plan).toBe('free');
    expect(status.subscriptionStatus).toBe('none');
  });

  it('does not activate on checkout alone', async () => {
    const adapter = createMemoryBillingAdapter();

    const checkout = await adapter.createCheckout({
      productId: 'prod_pro_10',
      planKey: 'pro_10',
      billingCycle: 'monthly',
      seats: 10,
      customerEmail: 'teacher@example.test',
      metadata: { tier: 'pro_10' },
      successUrl: 'https://app.example/studio?checkout_id={CHECKOUT_ID}',
    });

    expect(checkout.id).toMatch(/^chk_/);
    expect(checkout.url).toContain(checkout.id);

    const status = await adapter.getStatus('user_1');
    expect(status.plan).toBe('free');
    expect(status.subscriptionStatus).toBe('none');

    const history = await adapter.getBillingHistory('user_1');
    expect(history.length).toBe(0);
  });

  it('activates and records history on sync after checkout', async () => {
    const onCheckout = vi.fn();
    const adapter = createMemoryBillingAdapter({ onCheckout });

    const checkout = await adapter.createCheckout({
      productId: 'prod_pro_10',
      planKey: 'pro_10',
      billingCycle: 'monthly',
      seats: 10,
      metadata: { tier: 'pro_10' },
    });
    expect(onCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 'prod_pro_10',
        planKey: 'pro_10',
        seats: 10,
      }),
    );

    const before = await adapter.syncSubscription('user_1', checkout.id);
    expect(before).toEqual({ synced: true, plan: 'pro_10' });

    const status = await adapter.getStatus('user_1');
    expect(status.plan).toBe('pro_10');
    expect(status.subscriptionStatus).toBe('active');

    const history = await adapter.getBillingHistory('user_1');
    expect(history.length).toBe(1);
    expect(history[0].productName).toBe('pro_10');
    expect(history[0].paid).toBe(true);
  });

  it('reports not synced when there is no checkout to fulfill', async () => {
    const adapter = createMemoryBillingAdapter();
    const result = await adapter.syncSubscription('user_1');
    expect(result.synced).toBe(false);
  });

  it('cancels an active subscription gracefully', async () => {
    const onCancel = vi.fn();
    const adapter = createMemoryBillingAdapter({
      initialStatus: { plan: 'pro_10', subscriptionStatus: 'active' },
      onCancel,
    });

    const result = await adapter.cancelSubscription('too_expensive');
    expect(result.success).toBe(true);
    expect(onCancel).toHaveBeenCalledWith('too_expensive');

    const status = await adapter.getStatus('user_1');
    expect(status.subscriptionStatus).toBe('canceled');
  });

  it('refuses to cancel when there is no active subscription', async () => {
    const adapter = createMemoryBillingAdapter();
    const result = await adapter.cancelSubscription('unused');
    expect(result.success).toBe(false);
  });
});
