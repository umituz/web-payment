
import type { BillingAdapter } from '../../../domain/interfaces';
import type {
  CancellationReason,
  CancelResult,
  CheckoutParams,
  CheckoutResult,
  OrderItem,
  SubscriptionStatus,
  SyncResult,
} from '../../../domain/entities';
import { isActiveSubscription } from '../../../domain/entities';

export interface MemoryAdapterConfig {
  initialStatus?: Partial<SubscriptionStatus>;
  initialHistory?: OrderItem[];
  checkoutUrlBase?: string;
  portalUrl?: string;
  onCheckout?: (params: CheckoutParams) => void;
  onCancel?: (reason?: CancellationReason) => void;
}

interface PendingCheckout {
  id: string;
  params: CheckoutParams;
}

export function createMemoryBillingAdapter(config: MemoryAdapterConfig = {}): BillingAdapter {
  let status: SubscriptionStatus = {
    plan: 'free',
    subscriptionStatus: 'none',
    billingCycle: 'monthly',
    cancelAtPeriodEnd: false,
    ...config.initialStatus,
  };

  const history: OrderItem[] = config.initialHistory ? [...config.initialHistory] : [];
  const pending = new Map<string, PendingCheckout>();
  let sequence = 0;

  function checkoutUrl(checkout: PendingCheckout): string {
    if (checkout.params.successUrl) {
      return checkout.params.successUrl.replace('{CHECKOUT_ID}', checkout.id);
    }
    const base = config.checkoutUrlBase ?? 'https://checkout.example';
    return `${base.replace(/\/$/, '')}/${checkout.id}`;
  }

  function fulfill(checkout: PendingCheckout): SubscriptionStatus {
    const planName = checkout.params.planKey ?? checkout.params.productId ?? checkout.params.productKey ?? 'default';
    return {
      ...status,
      plan: planName,
      subscriptionStatus: 'active',
      subscriptionId: `sub_${checkout.id.slice(4)}`,
      billingCycle: checkout.params.billingCycle ?? status.billingCycle,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  return {
    async getStatus(_userId: string): Promise<SubscriptionStatus> {
      return { ...status };
    },

    async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
      config.onCheckout?.(params);
      sequence += 1;
      const checkout: PendingCheckout = {
        id: `chk_${Date.now()}_${sequence}`,
        params,
      };
      pending.set(checkout.id, checkout);
      return {
        id: checkout.id,
        url: checkoutUrl(checkout),
      };
    },

    async syncSubscription(_userId: string, checkoutId?: string): Promise<SyncResult> {
      const checkout = checkoutId ? pending.get(checkoutId) : undefined;
      const last = checkout ? undefined : [...pending.values()].pop();
      const target = checkout ?? last;
      if (!target) {
        return { synced: false, plan: status.plan };
      }
      status = fulfill(target);
      pending.delete(target.id);
      history.unshift({
        id: `ord_${target.id}`,
        amount: 0,
        currency: 'usd',
        createdAt: new Date().toISOString(),
        productName: target.params.planKey ?? target.params.productId,
        status: 'paid',
        paid: true,
      });
      return { synced: true, plan: status.plan };
    },

    async getBillingHistory(_userId: string): Promise<OrderItem[]> {
      return [...history];
    },

    async cancelSubscription(reason?: CancellationReason): Promise<CancelResult> {
      config.onCancel?.(reason);
      if (!isActiveSubscription(status)) {
        return { success: false };
      }
      status = {
        ...status,
        subscriptionStatus: 'canceled',
        cancelAtPeriodEnd: true,
      };
      return {
        success: true,
        endsAt: status.currentPeriodEnd ?? new Date().toISOString(),
      };
    },

    async getPortalUrl(_userId: string): Promise<string> {
      return config.portalUrl ?? 'https://portal.example/billing';
    },
  };
}
