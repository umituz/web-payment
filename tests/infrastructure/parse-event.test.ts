import { describe, it, expect } from 'vitest';
import {
    parseWebhookEvent,
    asCheckoutCompleted,
    asSubscriptionChanged,
    asOrderPaid,
} from '../../src/infrastructure/webhook/parse-event';
describe('parseWebhookEvent', () => {
    it('parses a well-formed event envelope', () => {
        const event = parseWebhookEvent('{"type":"checkout.created","data":{"id":"co_1"}}');
        expect(event).toEqual({ type: 'checkout.created', data: { id: 'co_1' } });
    });
    it('rejects malformed JSON, non-objects and missing type/data', () => {
        expect(parseWebhookEvent('not json')).toBeNull();
        expect(parseWebhookEvent('"checkout.completed"')).toBeNull();
        expect(parseWebhookEvent('{"data":{"id":"co_1"}}')).toBeNull();
        expect(parseWebhookEvent('{"type":"checkout.completed"}')).toBeNull();
        expect(parseWebhookEvent('{"type":"checkout.completed","data":null}')).toBeNull();
    });
});
describe('asCheckoutCompleted', () => {
    it('maps a snake_case checkout.completed payload to major units', () => {
        const raw = JSON.stringify({
            type: 'checkout.completed',
            data: {
                id: 'co_9',
                product_id: 'prod_9',
                customer_email: 'ingrid@example.com',
                customer_name: 'Ingrid Halvorsen',
                total_amount: 7900,
                currency: 'usd',
                metadata: { creatorId: 'crt_03', productId: 'prd_1' },
                created_at: '2026-10-31T18:04:00Z',
            },
        });
        const event = parseWebhookEvent(raw);
        expect(event).not.toBeNull();
        expect(asCheckoutCompleted(event!)).toEqual({
            checkoutId: 'co_9',
            productId: 'prod_9',
            customerEmail: 'ingrid@example.com',
            customerName: 'Ingrid Halvorsen',
            amount: 79,
            currency: 'usd',
            metadata: { creatorId: 'crt_03', productId: 'prd_1' },
            createdAt: '2026-10-31T18:04:00Z',
        });
    });
    it('falls back to nested product/customer objects and camelCase fields', () => {
        const raw = JSON.stringify({
            type: 'checkout.completed',
            data: {
                id: 'co_10',
                product: { id: 'prod_10' },
                customer: { email: 'magnus@example.com', name: 'Magnus Berg' },
                amount: 1900,
                currency: 'eur',
                createdAt: '2026-10-30T09:00:00Z',
            },
        });
        const checkout = asCheckoutCompleted(parseWebhookEvent(raw)!);
        expect(checkout).toMatchObject({
            productId: 'prod_10',
            customerEmail: 'magnus@example.com',
            customerName: 'Magnus Berg',
            amount: 19,
            currency: 'eur',
            createdAt: '2026-10-30T09:00:00Z',
        });
    });
    it('keeps zero-decimal currencies whole', () => {
        const raw = JSON.stringify({
            type: 'checkout.completed',
            data: { id: 'co_11', product_id: 'p', total_amount: 2500, currency: 'jpy' },
        });
        expect(asCheckoutCompleted(parseWebhookEvent(raw)!)).toMatchObject({ amount: 2500, currency: 'jpy' });
    });
    it('degrades missing fields to null instead of throwing', () => {
        const raw = JSON.stringify({ type: 'checkout.completed', data: {} });
        expect(asCheckoutCompleted(parseWebhookEvent(raw)!)).toEqual({
            checkoutId: null,
            productId: null,
            customerEmail: null,
            customerName: null,
            amount: null,
            currency: null,
            metadata: {},
            createdAt: null,
        });
    });
    it('returns null for any other event type', () => {
        const raw = JSON.stringify({ type: 'subscription.active', data: { id: 'sub_1' } });
        expect(asCheckoutCompleted(parseWebhookEvent(raw)!)).toBeNull();
    });
});
describe('asSubscriptionChanged', () => {
    it('maps a subscription.canceled payload with metadata', () => {
        const raw = JSON.stringify({
            type: 'subscription.canceled',
            data: {
                id: 'sub_7',
                status: 'canceled',
                product_id: 'prod_pro_10',
                amount: 1900,
                currency: 'usd',
                current_period_end: '2026-11-30T00:00:00Z',
                cancel_at_period_end: true,
                canceled_at: '2026-11-03T10:00:00Z',
                ends_at: '2026-11-30T00:00:00Z',
                customer_id: 'cus_7',
                metadata: { userId: 'usr_77', itemType: 'instructor_tier' },
            },
        });
        expect(asSubscriptionChanged(parseWebhookEvent(raw)!)).toEqual({
            subscriptionId: 'sub_7',
            status: 'canceled',
            productId: 'prod_pro_10',
            amount: 19,
            currency: 'usd',
            currentPeriodEnd: '2026-11-30T00:00:00Z',
            cancelAtPeriodEnd: true,
            canceledAt: '2026-11-03T10:00:00Z',
            endsAt: '2026-11-30T00:00:00Z',
            customerId: 'cus_7',
            metadata: { userId: 'usr_77', itemType: 'instructor_tier' },
        });
    });
    it('accepts every subscription lifecycle event type', () => {
        for (const type of [
            'subscription.active',
            'subscription.updated',
            'subscription.uncanceled',
            'subscription.revoked',
        ]) {
            const raw = JSON.stringify({ type, data: { id: 'sub_1', status: 'active' } });
            expect(asSubscriptionChanged(parseWebhookEvent(raw)!)).toMatchObject({
                subscriptionId: 'sub_1',
                status: 'active',
            });
        }
    });
    it('returns null for non-subscription events and keeps missing fields null', () => {
        expect(asSubscriptionChanged(parseWebhookEvent('{"type":"checkout.completed","data":{}}')!)).toBeNull();
        const raw = JSON.stringify({ type: 'subscription.updated', data: {} });
        expect(asSubscriptionChanged(parseWebhookEvent(raw)!)).toEqual({
            subscriptionId: null,
            status: null,
            productId: null,
            amount: null,
            currency: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            endsAt: null,
            customerId: null,
            metadata: {},
        });
    });
});
describe('asOrderPaid', () => {
    it('maps an order.paid payload to major units', () => {
        const raw = JSON.stringify({
            type: 'order.paid',
            data: {
                id: 'ord_42',
                product_id: 'prod_pass_10',
                product: { name: 'Session Pass 10' },
                amount: 1500,
                currency: 'usd',
                customer_email: 'learner@example.test',
                metadata: { userId: 'usr_77' },
                created_at: '2026-11-03T09:00:00Z',
            },
        });
        expect(asOrderPaid(parseWebhookEvent(raw)!)).toEqual({
            orderId: 'ord_42',
            productId: 'prod_pass_10',
            productName: 'Session Pass 10',
            amount: 15,
            currency: 'usd',
            customerEmail: 'learner@example.test',
            metadata: { userId: 'usr_77' },
            createdAt: '2026-11-03T09:00:00Z',
        });
    });
    it('returns null for other event types', () => {
        expect(asOrderPaid(parseWebhookEvent('{"type":"order.refunded","data":{}}')!)).toBeNull();
    });
});
