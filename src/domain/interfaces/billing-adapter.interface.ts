import type {
  SubscriptionStatus,
  CheckoutParams,
  CheckoutResult,
  OrderItem,
  CancellationReason,
  CancelResult,
  SyncResult,
} from '../entities';

export interface BillingAdapter {
  getStatus(userId: string): Promise<SubscriptionStatus>;
  createCheckout(params: CheckoutParams): Promise<CheckoutResult>;
  syncSubscription(userId: string, checkoutId?: string): Promise<SyncResult>;
  getBillingHistory(userId: string): Promise<OrderItem[]>;
  cancelSubscription(reason?: CancellationReason): Promise<CancelResult>;
  getPortalUrl(userId: string): Promise<string>;
}
