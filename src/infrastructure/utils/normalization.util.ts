
import {
  SUBSCRIPTION_STATUS,
  isKnownSubscriptionStatus,
  type SubscriptionStatusValue,
} from '../../domain/enums/subscription-status.enum';
import {
  BILLING_CYCLE,
  parseBillingCycle,
  type BillingCycle,
} from '../../domain/enums/billing-cycle.enum';

export function normalizeStatus(raw: string | null | undefined): SubscriptionStatusValue {
  if (typeof raw !== 'string') return SUBSCRIPTION_STATUS.NONE;
  return isKnownSubscriptionStatus(raw) ? raw : SUBSCRIPTION_STATUS.NONE;
}

export function normalizeBillingCycle(
  interval: string | null | undefined,
): BillingCycle {
  return parseBillingCycle(interval) ?? BILLING_CYCLE.MONTHLY;
}
