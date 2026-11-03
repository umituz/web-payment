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
export interface SubscriptionChanged {
    subscriptionId: string | null;
    status: string | null;
    productId: string | null;
    amount: number | null;
    currency: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
    endsAt: string | null;
    customerId: string | null;
    metadata: Record<string, string>;
}
export interface OrderPaid {
    orderId: string | null;
    productId: string | null;
    productName: string | null;
    amount: number | null;
    currency: string | null;
    customerEmail: string | null;
    metadata: Record<string, string>;
    createdAt: string | null;
}
const SUBSCRIPTION_EVENT_TYPES = new Set([
    'subscription.active',
    'subscription.canceled',
    'subscription.updated',
    'subscription.uncanceled',
    'subscription.revoked',
]);
function readString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}
function readNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
function readObject(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}
function readMetadata(value: unknown): Record<string, string> {
    const metadata = readObject(value);
    if (!metadata)
        return {};
    return Object.fromEntries(Object.entries(metadata).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
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
    const minorUnits = readNumber(data.total_amount ?? data.amount);
    const currency = readString(data.currency);
    return {
        checkoutId: readString(data.id),
        productId: readString(data.product_id) ?? (product ? readString(product.id) : null),
        customerEmail: readString(data.customer_email) ?? (customer ? readString(customer.email) : null),
        customerName: readString(data.customer_name) ?? (customer ? readString(customer.name) : null),
        amount: minorUnits !== null && currency ? toMajorUnits(minorUnits, currency) : null,
        currency,
        metadata: readMetadata(data.metadata),
        createdAt: readString(data.created_at) ?? readString(data.createdAt),
    };
}
export function asSubscriptionChanged(event: WebhookEvent): SubscriptionChanged | null {
    if (!SUBSCRIPTION_EVENT_TYPES.has(event.type))
        return null;
    const data = event.data;
    const minorUnits = readNumber(data.amount);
    const currency = readString(data.currency);
    return {
        subscriptionId: readString(data.id),
        status: readString(data.status),
        productId: readString(data.product_id),
        amount: minorUnits !== null && currency ? toMajorUnits(minorUnits, currency) : null,
        currency,
        currentPeriodEnd: readString(data.current_period_end),
        cancelAtPeriodEnd: data.cancel_at_period_end === true,
        canceledAt: readString(data.canceled_at),
        endsAt: readString(data.ends_at),
        customerId: readString(data.customer_id),
        metadata: readMetadata(data.metadata),
    };
}
export function asOrderPaid(event: WebhookEvent): OrderPaid | null {
    if (event.type !== 'order.paid')
        return null;
    const data = event.data;
    const product = readObject(data.product);
    const customer = readObject(data.customer);
    const minorUnits = readNumber(data.amount);
    const currency = readString(data.currency);
    return {
        orderId: readString(data.id),
        productId: readString(data.product_id) ?? (product ? readString(product.id) : null),
        productName: readString(data.product_name) ?? (product ? readString(product.name) : null),
        amount: minorUnits !== null && currency ? toMajorUnits(minorUnits, currency) : null,
        currency,
        customerEmail: readString(data.customer_email) ?? (customer ? readString(customer.email) : null),
        metadata: readMetadata(data.metadata),
        createdAt: readString(data.created_at) ?? readString(data.paid_at),
    };
}
