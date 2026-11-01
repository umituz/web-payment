import { toMajorUnits } from '../../domain/utils/minor-units';
export interface WebhookEvent {
    type: string;
    data: Record<string, unknown>;
}
export interface CheckoutCompleted {
    checkoutId: string | null;
    productId: string | null;
    customerEmail: string | null;
    customerName: string | null;
    amount: number | null;
    currency: string | null;
    metadata: Record<string, string>;
    createdAt: string | null;
}
function readString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}
function readObject(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}
export function parseWebhookEvent(rawBody: string): WebhookEvent | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawBody);
    }
    catch {
        return null;
    }
    const envelope = readObject(parsed);
    const type = envelope ? readString(envelope.type) : null;
    const data = envelope ? readObject(envelope.data) : null;
    if (!envelope || !type || !data)
        return null;
    return { type, data };
}
export function asCheckoutCompleted(event: WebhookEvent): CheckoutCompleted | null {
    if (event.type !== 'checkout.completed')
        return null;
    const data = event.data;
    const product = readObject(data.product);
    const customer = readObject(data.customer);
    const minorUnits = typeof (data.total_amount ?? data.amount) === 'number'
        ? (data.total_amount ?? data.amount) as number
        : null;
    const currency = readString(data.currency);
    const metadata = readObject(data.metadata);
    return {
        checkoutId: readString(data.id),
        productId: readString(data.product_id) ?? (product ? readString(product.id) : null),
        customerEmail: readString(data.customer_email) ?? (customer ? readString(customer.email) : null),
        customerName: readString(data.customer_name) ?? (customer ? readString(customer.name) : null),
        amount: minorUnits !== null && currency ? toMajorUnits(minorUnits, currency) : null,
        currency,
        metadata: metadata
            ? Object.fromEntries(Object.entries(metadata)
                .filter((entry): entry is [
                string,
                string
            ] => typeof entry[1] === 'string'))
            : {},
        createdAt: readString(data.created_at) ?? readString(data.createdAt),
    };
}
