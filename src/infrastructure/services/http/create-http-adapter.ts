
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

export interface HttpAdapterConfig {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  getUserId?: () => string | undefined | Promise<string | undefined>;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
}

interface ErrorEnvelope {
  error?: string | { message?: string };
  message?: string;
}

function errorMessage(status: number, body: unknown): string {
  const envelope = (body ?? {}) as ErrorEnvelope;
  const errorDetail = typeof envelope.error === 'string' ? envelope.error : envelope.error?.message;
  const detail = errorDetail ?? envelope.message ?? 'Billing request failed';
  return `${detail} (HTTP ${status})`;
}

export function createHttpAdapter(config: HttpAdapterConfig = {}): BillingAdapter {
  const baseUrl = (config.baseUrl ?? '/api/billing').replace(/\/$/, '');
  const doFetch = config.fetchImpl ?? globalThis.fetch.bind(globalThis);

  async function request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
    explicitUserId?: string,
  ): Promise<T> {
    const userId = explicitUserId || (config.getUserId ? await config.getUserId() : undefined);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(config.getHeaders ? await config.getHeaders() : {}),
    };
    const withUser = { ...(userId ? { userId } : {}), ...(body ?? {}) };
    if (Object.keys(withUser).length > 0) headers['Content-Type'] = 'application/json';

    const query = userId && method === 'GET' ? `?userId=${encodeURIComponent(userId)}` : '';
    const response = await doFetch(`${baseUrl}${path}${query}`, {
      method,
      headers,
      ...(method === 'POST' && Object.keys(withUser).length > 0 ? { body: JSON.stringify(withUser) } : {}),
    });

    let data: unknown = null;
    const text = await response.text();
    if (text.length > 0) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (!response.ok) {
      throw new Error(errorMessage(response.status, data));
    }
    return data as T;
  }

  return {
    getStatus(userId: string) {
      return request<SubscriptionStatus>('GET', '/status', undefined, userId);
    },

    createCheckout(params: CheckoutParams) {
      return request<CheckoutResult>(
        'POST',
        '/checkout',
        {
          ...(params.productId ? { productId: params.productId } : {}),
          ...(params.productKey ? { productKey: params.productKey } : {}),
          ...(params.itemId ? { itemId: params.itemId } : {}),
          ...(params.couponCode ? { couponCode: params.couponCode } : {}),
          ...(params.billingCycle ? { billingCycle: params.billingCycle } : {}),
          ...(params.successUrl ? { successUrl: params.successUrl } : {}),
          ...(params.planKey ? { planKey: params.planKey } : {}),
          ...(params.customerEmail ? { customerEmail: params.customerEmail } : {}),
          ...(params.seats !== undefined ? { seats: params.seats } : {}),
          ...(params.metadata ? { metadata: params.metadata } : {}),
        },
        params.userId,
      );
    },

    syncSubscription(userId: string, checkoutId?: string) {
      return request<SyncResult>('POST', '/sync', checkoutId ? { checkoutId } : undefined, userId);
    },

    async getBillingHistory(userId: string) {
      const result = await request<OrderItem[] | { items?: OrderItem[]; orders?: OrderItem[] }>(
        'GET',
        '/history',
        undefined,
        userId,
      );
      if (Array.isArray(result)) return result;
      return result.orders ?? result.items ?? [];
    },

    cancelSubscription(reason?: CancellationReason) {
      return request<CancelResult>('POST', '/cancel', {
        ...(reason ? { reason } : {}),
      });
    },

    async getPortalUrl(userId: string) {
      const result = await request<string | { url: string }>('GET', '/portal', undefined, userId);
      return typeof result === 'string' ? result : result.url;
    },
  };
}
