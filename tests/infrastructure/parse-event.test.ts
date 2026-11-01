import { describe, it, expect } from 'vitest';
import { parseWebhookEvent, asCheckoutCompleted } from '../../src/infrastructure/webhook/parse-event';
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
