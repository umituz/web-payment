
import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { InvoiceStatus, SubscriptionStatus } from './types';

export function formatLabel(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

export interface BillingLabels {
  common: {
    loading: string;
    usage: string;
  };
  page: {
    backToDashboard: string;
    title: string;
    description: string;
    needHelp: string;
    contactAria: string;
  };
  tabs: {
    overview: string;
    paymentMethods: string;
    invoices: string;
    plan: string;
  };
  overview: {
    currentSubscription: string;
    trialDaysLeft: string;
    nextBilling: string;
    upcomingInvoice: string;
  };
  invoices: {
    empty: string;
    moreItems: string;
    due: string;
    viewInvoice: string;
    downloadPdf: string;
  };
  plan: {
    title: string;
    actionsTitle: string;
    changePlan: string;
    cancelSubscription: string;
    confirmCancel: string;
    cancelling: string;
    cancelConfirmMessage: string;
    cancelFailed: string;
  };
  planComparison: {
    monthly: string;
    yearly: string;
    monthlyShort: string;
    yearlyShort: string;
    save: string;
    saveWithYearly: string;
    mostPopular: string;
    currentPlan: string;
    selectPlan: string;
    processing: string;
    billingCycleLabel: string;
    radiogroupLabel: string;
  };
  paymentMethods: {
    none: string;
    add: string;
    bankAccount: string;
    expires: string;
    default: string;
    setDefault: string;
    remove: string;
    removeConfirm: string;
    confirmRemove: string;
    cancelRemove: string;
  };
  usage: {
    limit: string;
    resets: string;
  };
  status: Record<SubscriptionStatus, string>;
  invoiceStatus: Record<InvoiceStatus, string>;
}

export type BillingLabelsOverrides = {
  [K in keyof BillingLabels]?: BillingLabels[K] extends string
    ? string
    : { [K2 in keyof BillingLabels[K]]?: BillingLabels[K][K2] };
};

export const DEFAULT_BILLING_LABELS: Readonly<BillingLabels> = Object.freeze({
  common: Object.freeze({
    loading: 'Loading…',
    usage: 'usage',
  }),
  page: Object.freeze({
    backToDashboard: 'Back to dashboard',
    title: 'Billing',
    description: 'Manage your subscription, payment methods, and invoices.',
    needHelp: 'Need help?',
    contactAria: 'Contact {email}',
  }),
  tabs: Object.freeze({
    overview: 'Overview',
    paymentMethods: 'Payment Methods',
    invoices: 'Invoices',
    plan: 'Plan',
  }),
  overview: Object.freeze({
    currentSubscription: 'Current Subscription',
    trialDaysLeft: 'days left in trial',
    nextBilling: 'Next billing:',
    upcomingInvoice: 'Upcoming Invoice',
  }),
  invoices: Object.freeze({
    empty: 'No invoices yet',
    moreItems: 'more items',
    due: 'Due',
    viewInvoice: 'View invoice',
    downloadPdf: 'Download PDF',
  }),
  plan: Object.freeze({
    title: 'Current Plan',
    actionsTitle: 'Plan Actions',
    changePlan: 'Change Plan',
    cancelSubscription: 'Cancel Subscription',
    confirmCancel: 'Click again to confirm',
    cancelling: 'Cancelling…',
    cancelConfirmMessage:
      'Your subscription stays active until the end of the current billing period.',
    cancelFailed: 'Failed to cancel subscription. Please try again.',
  }),
  planComparison: Object.freeze({
    monthly: 'Monthly',
    yearly: 'Yearly',
    monthlyShort: 'mo',
    yearlyShort: 'yr',
    save: 'Save {percent}%',
    saveWithYearly: 'Save {percent}% with yearly billing',
    mostPopular: 'Most Popular',
    currentPlan: 'Current Plan',
    selectPlan: 'Select Plan',
    processing: 'Processing…',
    billingCycleLabel: 'Billing cycle',
    radiogroupLabel: 'Available plans',
  }),
  paymentMethods: Object.freeze({
    none: 'No payment methods on file',
    add: 'Add Payment Method',
    bankAccount: 'Bank Account',
    expires: 'Expires',
    default: 'Default',
    setDefault: 'Set as default',
    remove: 'Remove',
    removeConfirm: 'Remove this payment method?',
    confirmRemove: 'Remove',
    cancelRemove: 'Cancel',
  }),
  usage: Object.freeze({
    limit: 'limit',
    resets: 'Resets',
  }),
  status: Object.freeze({
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
    revoked: 'Revoked',
  }),
  invoiceStatus: Object.freeze({
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    void: 'Void',
    uncollectible: 'Uncollectible',
    refunded: 'Refunded',
  }),
});

export function mergeLabels(overrides?: BillingLabelsOverrides): BillingLabels {
  if (!overrides) return { ...DEFAULT_BILLING_LABELS } as BillingLabels;
  const merged = { ...DEFAULT_BILLING_LABELS } as BillingLabels;
  for (const key of Object.keys(overrides) as (keyof BillingLabelsOverrides)[]) {
    const override = overrides[key];
    if (override === undefined) continue;
    const base = DEFAULT_BILLING_LABELS[key];
    const target = merged as unknown as Record<string, unknown>;
    if (typeof base === 'string' || typeof override === 'string') {
      target[key] = override;
    } else {
      target[key] = { ...base, ...override };
    }
  }
  return merged;
}

const BillingLabelsContext = createContext<BillingLabels>(
  DEFAULT_BILLING_LABELS as BillingLabels,
);

export function BillingLabelsProvider({
  labels,
  children,
}: {
  labels?: BillingLabelsOverrides;
  children: ReactNode;
}) {
  const value = useMemo(() => mergeLabels(labels), [labels]);
  return <BillingLabelsContext.Provider value={value}>{children}</BillingLabelsContext.Provider>;
}

export function useBillingLabels(): BillingLabels {
  return useContext(BillingLabelsContext);
}
