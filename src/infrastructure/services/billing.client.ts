import type { PaymentProvider } from '../../domain/enums/payment-provider.enum';
import { API_BASE_URL } from '../constants/billing.constants';
import { HttpClient, FetchHttpClient } from '../http/http-client';
import { BillingApiError } from './product.repository';

export const SANDBOX_API_BASE_URL = 'https://sandbox-api.polar.sh/v1';

export interface PaymentServerClient {
  readonly provider: PaymentProvider;
  createProduct?(params: CreateProductParams): Promise<CreatedProduct>;
  createCheckout(params: CheckoutSessionParams): Promise<CheckoutSession>;
  getCheckout(id: string): Promise<CheckoutSession>;
  createPortalSession?(customerId: string, returnUrl?: string): Promise<PortalSession>;
  getSubscription?(id: string): Promise<SubscriptionRecord>;
  listSubscriptions?(filter?: { customerId?: string; productId?: string }): Promise<SubscriptionRecord[]>;
  updateSubscription?(id: string, patch: { cancelAtPeriodEnd?: boolean }): Promise<SubscriptionRecord>;
}

export interface BillingClientConfig {
  apiToken: string;
  baseUrl?: string;
  sandbox?: boolean;
  http?: HttpClient;
}

export type CheckoutMetadata = Record<string, string | number | boolean>;

export interface CheckoutSessionParams {
  productId: string;
  successUrl?: string;
  customerId?: string;
  customerEmail?: string;
  externalCustomerId?: string;
  amountCents?: number;
  currency?: string;
  allowDiscountCodes?: boolean;
  metadata?: CheckoutMetadata;
}

export interface CheckoutSession {
  id: string;
  url: string;
  status?: string;
  customerId?: string;
  customerEmail?: string;
  subscriptionId?: string | null;
  metadata?: CheckoutMetadata;
}

export interface SubscriptionRecord {
  id: string;
  status: string;
  productId: string;
  amountCents: number;
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string | null;
  endsAt?: string | null;
  startedAt?: string | null;
  customerId: string;
  metadata: Record<string, string>;
}

export interface PortalSession {
  url: string;
}

export interface CreateProductParams {
  name: string;
  description?: string;
  amountCents: number;
  currency?: string;
  metadata?: CheckoutMetadata;
}

export interface CreatedProduct {
  id: string;
  name: string;
}

interface ProductDto {
  id: string;
  name?: string | null;
}

interface CheckoutDto {
  id: string;
  url?: string;
  status?: string;
  customer_id?: string | null;
  customer_email?: string | null;
  subscription_id?: string | null;
  metadata?: CheckoutMetadata | null;
}

interface SubscriptionDto {
  id: string;
  status: string;
  product_id: string;
  amount: number;
  currency: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  ends_at?: string | null;
  started_at?: string | null;
  customer_id?: string | null;
  metadata?: Record<string, string> | null;
}

interface SubscriptionListDto {
  items?: SubscriptionDto[];
  pagination?: { max_page?: number; current_page?: number; total_count?: number };
}

function resolveBaseUrl(config: BillingClientConfig): string {
  if (config.baseUrl) return config.baseUrl;
  return config.sandbox ? SANDBOX_API_BASE_URL : API_BASE_URL;
}

function mapCheckout(dto: CheckoutDto): CheckoutSession {
  return {
    id: dto.id,
    url: dto.url ?? '',
    status: dto.status,
    customerId: dto.customer_id ?? undefined,
    customerEmail: dto.customer_email ?? undefined,
    subscriptionId: dto.subscription_id ?? null,
    metadata: dto.metadata ?? undefined,
  };
}

function mapSubscription(dto: SubscriptionDto): SubscriptionRecord {
  return {
    id: dto.id,
    status: dto.status,
    productId: dto.product_id,
    amountCents: dto.amount,
    currency: dto.currency,
    currentPeriodStart: dto.current_period_start ?? undefined,
    currentPeriodEnd: dto.current_period_end ?? undefined,
    cancelAtPeriodEnd: dto.cancel_at_period_end,
    canceledAt: dto.canceled_at ?? null,
    endsAt: dto.ends_at ?? null,
    startedAt: dto.started_at ?? undefined,
    customerId: dto.customer_id ?? '',
    metadata: dto.metadata ?? {},
  };
}

export class PolarBillingClient implements PaymentServerClient {
  readonly provider = 'polar' as const;
  private readonly http: HttpClient;
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(config: BillingClientConfig) {
    this.http = config.http ?? new FetchHttpClient();
    this.baseUrl = resolveBaseUrl(config).replace(/\/$/, '');
    this.headers = { Authorization: `Bearer ${config.apiToken}` };
  }

  private async request<T>(method: 'GET' | 'POST' | 'PATCH', path: string, body?: unknown): Promise<T> {
    const response = await this.http.request<T>({
      method,
      url: `${this.baseUrl}${path}`,
      headers: this.headers,
      body,
    });
    if (!response.ok) {
      throw new BillingApiError(
        `Billing API ${method} ${path} failed with ${response.status}`,
        response.status,
        await response.text(),
      );
    }
    return (response.data ?? {}) as T;
  }

  async createProduct(params: CreateProductParams): Promise<CreatedProduct> {
    const dto = await this.request<ProductDto>('POST', '/products', {
      name: params.name,
      recurring_interval: null,
      ...(params.description ? { description: params.description } : {}),
      prices: [
        {
          amount_type: 'fixed',
          price_currency: params.currency ?? 'usd',
          price_amount: params.amountCents,
        },
      ],
      ...(params.metadata ? { metadata: params.metadata } : {}),
    });
    return { id: dto.id, name: dto.name ?? params.name };
  }

  async createCheckout(params: CheckoutSessionParams): Promise<CheckoutSession> {
    const dto = await this.request<CheckoutDto>('POST', '/checkouts', {
      products: [params.productId],
      ...(params.amountCents !== undefined
        ? {
            prices: {
              [params.productId]: [
                {
                  amount_type: 'fixed',
                  price_currency: params.currency ?? 'usd',
                  price_amount: params.amountCents,
                },
              ],
            },
          }
        : {}),
      ...(params.successUrl ? { success_url: params.successUrl } : {}),
      ...(params.customerId ? { customer_id: params.customerId } : {}),
      ...(params.customerEmail ? { customer_email: params.customerEmail } : {}),
      ...(params.externalCustomerId ? { external_customer_id: params.externalCustomerId } : {}),
      ...(params.allowDiscountCodes !== undefined
        ? { allow_discount_codes: params.allowDiscountCodes }
        : {}),
      ...(params.metadata ? { metadata: params.metadata } : {}),
    });
    return mapCheckout(dto);
  }

  async getCheckout(id: string): Promise<CheckoutSession> {
    const dto = await this.request<CheckoutDto>('GET', `/checkouts/${encodeURIComponent(id)}`);
    return mapCheckout(dto);
  }

  async createPortalSession(customerId: string, returnUrl?: string): Promise<PortalSession> {
    const dto = await this.request<{ customer_portal_url?: string }>(
      'POST',
      '/customer-sessions',
      {
        customer_id: customerId,
        ...(returnUrl ? { return_url: returnUrl } : {}),
      },
    );
    const url = dto.customer_portal_url;
    if (!url) {
      throw new BillingApiError('Billing customer portal session returned no URL', 500, JSON.stringify(dto));
    }
    return { url };
  }

  async getSubscription(id: string): Promise<SubscriptionRecord> {
    const dto = await this.request<SubscriptionDto>('GET', `/subscriptions/${encodeURIComponent(id)}`);
    return mapSubscription(dto);
  }

  async listSubscriptions(filter: { customerId?: string; productId?: string } = {}): Promise<SubscriptionRecord[]> {
    const query = new URLSearchParams();
    if (filter.customerId) query.set('customer_id', filter.customerId);
    if (filter.productId) query.set('product_id', filter.productId);
    const suffix = query.size > 0 ? `?${query.toString()}` : '';
    const first = await this.request<SubscriptionListDto>('GET', `/subscriptions${suffix}`);
    const records: SubscriptionDto[] = [...(first.items ?? [])];
    const maxPage = typeof first.pagination?.max_page === 'number' ? first.pagination.max_page : 1;
    for (let page = 2; page <= maxPage; page += 1) {
      const next = await this.request<SubscriptionListDto>(
        'GET',
        `/subscriptions${suffix}${suffix ? '&' : '?'}page=${page}`,
      );
      records.push(...(next.items ?? []));
    }
    return records.map(mapSubscription);
  }

  async updateSubscription(
    id: string,
    patch: { cancelAtPeriodEnd?: boolean },
  ): Promise<SubscriptionRecord> {
    const body = patch.cancelAtPeriodEnd !== undefined
      ? { cancel_at_period_end: patch.cancelAtPeriodEnd }
      : undefined;
    const dto = await this.request<SubscriptionDto>(
      'PATCH',
      `/subscriptions/${encodeURIComponent(id)}`,
      body,
    );
    return mapSubscription(dto);
  }
}

export const BillingClient = PolarBillingClient;
export type BillingClient = PolarBillingClient;

export type PaymentClientConfig =
  | ({ provider?: 'polar' } & BillingClientConfig)
  | { provider: 'stripe'; apiKey: string; [key: string]: unknown };

export function createPaymentClient(config: PaymentClientConfig): PaymentServerClient {
  if (config.provider === 'stripe') {
    throw new Error('Stripe provider client is not yet supported. Use provider "polar" or custom adapter.');
  }
  return new PolarBillingClient(config);
}
