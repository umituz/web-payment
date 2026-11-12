export type SubscriptionLifecycleStatus = 'active' | 'canceled' | 'revoked' | 'none';

export interface SubscriptionLifecycle {
  status: SubscriptionLifecycleStatus;
  subscriptionId?: string;
  renewsAt?: string;
}

const LIFECYCLE_STATUSES: ReadonlySet<string> = new Set<string>([
  'active',
  'canceled',
  'revoked',
  'none',
]);

export function normalizeSubscriptionLifecycle(value: unknown): SubscriptionLifecycle {
  const doc = (value && typeof value === 'object' ? value : {}) as Partial<SubscriptionLifecycle>;
  const status =
    typeof doc.status === 'string' && LIFECYCLE_STATUSES.has(doc.status)
      ? (doc.status as SubscriptionLifecycleStatus)
      : 'none';
  return {
    status,
    subscriptionId: typeof doc.subscriptionId === 'string' ? doc.subscriptionId : undefined,
    renewsAt: typeof doc.renewsAt === 'string' ? doc.renewsAt : undefined,
  };
}

export function isActiveLifecycle(lifecycle: SubscriptionLifecycle): boolean {
  return lifecycle.status === 'active';
}

export function isTerminalLifecycle(lifecycle: SubscriptionLifecycle): boolean {
  return lifecycle.status === 'canceled' || lifecycle.status === 'revoked';
}
