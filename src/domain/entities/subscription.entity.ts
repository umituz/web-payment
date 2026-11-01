import type { SubscriptionStatusValue } from '../enums/subscription-status.enum';
import type { BillingCycle } from '../enums/billing-cycle.enum';

export interface SubscriptionStatus {
  plan: string;
  subscriptionId?: string;
  subscriptionStatus: SubscriptionStatusValue;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
  billingCycle?: BillingCycle;
  providerCustomerId?: string;
}

export const FREE_SUBSCRIPTION_STATUS: SubscriptionStatus = Object.freeze({
  plan: 'free',
  subscriptionStatus: 'none',
}) as SubscriptionStatus;

export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return (
    status.subscriptionStatus === 'active' ||
    status.subscriptionStatus === 'trialing'
  );
}
