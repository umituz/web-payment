import { createContext, useContext } from 'react';
import type {
  SubscriptionStatus,
  CheckoutParams,
  CancellationReason,
  CancelResult,
  SyncResult,
  OrderItem,
} from '../../domain/entities';

export interface BillingContextValue {
  status: SubscriptionStatus;
  loading: boolean;
  refresh: () => Promise<void>;
  startCheckout: (params: CheckoutParams) => Promise<void>;
  syncSubscription: () => Promise<SyncResult>;
  getBillingHistory: () => Promise<OrderItem[]>;
  cancelSubscription: (reason?: CancellationReason) => Promise<CancelResult>;
  getPortalUrl: () => Promise<string>;
}

export const BillingContext = createContext<BillingContextValue | undefined>(undefined);

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) {
    throw new Error('useBilling must be used within <BillingProvider>');
  }
  return ctx;
}
