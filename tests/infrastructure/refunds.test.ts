import { describe, it, expect } from 'vitest';
import { BillingClient } from '../../src/infrastructure/services/billing.client';
import { BillingApiError } from '../../src/infrastructure/services/product.repository';
import type { HttpClient, HttpRequest, HttpResponse } from '../../src/infrastructure/http/http-client';
import {
  asOrderRefunded,
  asRefundCreated,
  asRefundUpdated,
  asSubscriptionCycled,
  parseWebhookEvent,
} from '../../src/infrastructure/webhook/parse-event';

function httpClientReturning(data: unknown, status = 200): HttpClient & { calls: HttpRequest[] } {
  const calls: HttpRequest[] = [];
  const text = JSON.stringify(data);
  const client = {
    async request<T>(request: HttpRequest): Promise<HttpResponse<T>> {
      calls.push(request);
      return {
        status,
        ok: status >= 200 && status < 300,
        data: (status >= 200 && status < 300 ? data : null) as T | null,
        text: async () => text,
      };
    },
  };
  return Object.assign(client, { calls });
}

describe('createProduct recurring_interval', () => {
  it('passes the recurring interval through and defaults to one-time', async () => {
    const recurring = httpClientReturning({ id: 'prod_m', name: 'Monthly plan' });
    const oneTime = httpClientReturning({ id: 'prod_p', name: 'Package' });
    const recurringClient = new BillingClient({ apiToken: 'oat', http: recurring });
    const oneTimeClient = new BillingClient({ apiToken: 'oat', http: oneTime });

    await recurringClient.createProduct({
      name: 'Monthly plan',
      amountCents: 9900,
      recurringInterval: 'month',
    });
    await oneTimeClient.createProduct({ name: 'Package', amountCents: 9000 });

    expect(recurring.calls[0]?.body).toMatchObject({ recurring_interval: 'month' });
    expect(oneTime.calls[0]?.body).toMatchObject({ recurring_interval: null });
  });
});

describe('payments & refunds', () => {
  it('lists payments for an order across pages', async () => {
    let page = 1;
    const client = new BillingClient({
      apiToken: 'oat',
      http: {
        async request<T>(_request: HttpRequest): Promise<HttpResponse<T>> {
          const body = page === 1
            ? { items: [{ id: 'pay_1', status: 'captured', amount: 4000, currency: 'usd', order_id: 'ord_1' }], pagination: { max_page: 2 } }
            : { items: [{ id: 'pay_2', status: 'refunded', amount: 1000, currency: 'usd', order_id: 'ord_1' }], pagination: { max_page: 2 } };
          page += 1;
          return { status: 200, ok: true, data: body as T, text: async () => JSON.stringify(body) };
        },
      },
    });

    const payments = await client.listPayments({ orderId: 'ord_1' });
    expect(payments).toHaveLength(2);
    expect(payments[0]).toMatchObject({ id: 'pay_1', status: 'captured', amountCents: 4000, orderId: 'ord_1' });
    expect(payments[1]).toMatchObject({ id: 'pay_2', status: 'refunded' });
  });

  it('creates a refund with payment id, amount and reason', async () => {
    const http = httpClientReturning({
      id: 're_1',
      status: 'pending',
      amount: 4000,
      currency: 'usd',
      payment_id: 'pay_1',
      order_id: 'ord_1',
      reason: 'requested_by_customer',
      created_at: '2026-11-14T10:00:00Z',
    });
    const client = new BillingClient({ apiToken: 'oat', http });

    const refund = await client.createRefund({
      paymentId: 'pay_1',
      amountCents: 4000,
      reason: 'requested_by_customer',
      metadata: { bookingId: 'bk_1' },
    });

    expect(refund).toMatchObject({
      id: 're_1',
      status: 'pending',
      amountCents: 4000,
      currency: 'usd',
      paymentId: 'pay_1',
      orderId: 'ord_1',
      reason: 'requested_by_customer',
    });
    expect(http.calls[0]?.url).toBe('https://api.polar.sh/v1/refunds');
    expect(http.calls[0]?.body).toEqual({
      payment_id: 'pay_1',
      amount: 4000,
      reason: 'requested_by_customer',
      metadata: { bookingId: 'bk_1' },
    });
  });

  it('refuses to refund without a payment or order id', async () => {
    const client = new BillingClient({ apiToken: 'oat', http: httpClientReturning({}) });
    await expect(client.createRefund({})).rejects.toBeInstanceOf(BillingApiError);
  });

  it('lists refunds filtered by order id', async () => {
    const http = httpClientReturning({ items: [{ id: 're_2', status: 'succeeded', amount: 900, currency: 'usd', order_id: 'ord_2' }], pagination: { max_page: 1 } });
    const client = new BillingClient({ apiToken: 'oat', http });

    const refunds = await client.listRefunds({ orderId: 'ord_2' });
    expect(refunds).toHaveLength(1);
    expect(refunds[0]).toMatchObject({ id: 're_2', status: 'succeeded', amountCents: 900 });
    expect(http.calls[0]?.url).toBe('https://api.polar.sh/v1/refunds?order_id=ord_2');
  });
});

describe('refund & cycle webhook guards', () => {
  it('parses order.refunded with the order.paid shape', () => {
    const event = parseWebhookEvent(JSON.stringify({
      type: 'order.refunded',
      data: {
        id: 'ord_9',
        product_id: 'prod_9',
        amount: 5000,
        currency: 'usd',
        metadata: { orderId: 'ord_9' },
      },
    }));
    expect(event).not.toBeNull();
    const refunded = asOrderRefunded(event!);
    expect(refunded).toMatchObject({ orderId: 'ord_9', amount: 50, currency: 'usd' });
    expect(asOrderRefunded(parseWebhookEvent(JSON.stringify({ type: 'order.paid', data: {} }))!)).toBeNull();
  });

  it('parses subscription.cycled with period bounds', () => {
    const event = parseWebhookEvent(JSON.stringify({
      type: 'subscription.cycled',
      data: {
        id: 'sub_1',
        status: 'active',
        product_id: 'prod_m',
        amount: 9900,
        currency: 'usd',
        current_period_start: '2026-12-01T00:00:00Z',
        current_period_end: '2027-01-01T00:00:00Z',
        customer_id: 'cus_1',
        metadata: { tutorId: 'tpl_1' },
      },
    }));
    const cycled = asSubscriptionCycled(event!);
    expect(cycled).toMatchObject({
      subscriptionId: 'sub_1',
      amount: 99,
      currentPeriodEnd: '2027-01-01T00:00:00Z',
      metadata: { tutorId: 'tpl_1' },
    });
    // Not part of the subscription-changed family.
    expect(asSubscriptionCycled(parseWebhookEvent(JSON.stringify({ type: 'subscription.active', data: {} }))!)).toBeNull();
  });

  it('parses refund.created and refund.updated', () => {
    const payload = JSON.stringify({
      type: 'refund.created',
      data: {
        id: 're_3',
        status: 'pending',
        amount: 2500,
        currency: 'usd',
        payment_id: 'pay_3',
        order_id: 'ord_3',
        reason: 'duplicate',
      },
    });
    const created = asRefundCreated(parseWebhookEvent(payload)!);
    expect(created).toMatchObject({ refundId: 're_3', status: 'pending', amount: 25, paymentId: 'pay_3', reason: 'duplicate' });

    const updated = asRefundUpdated(parseWebhookEvent(payload.replace('refund.created', 'refund.updated').replace('pending', 'succeeded'))!);
    expect(updated).toMatchObject({ refundId: 're_3', status: 'succeeded' });

    expect(asRefundCreated(parseWebhookEvent(payload.replace('refund.created', 'order.paid'))!)).toBeNull();
  });
});
