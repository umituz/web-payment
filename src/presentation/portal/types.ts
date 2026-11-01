
import type { ReactNode } from 'react';
import { BILLING_CYCLE } from '../../domain/enums/billing-cycle.enum';
import type { BillingCycle } from '../../domain/enums/billing-cycle.enum';
import { SUBSCRIPTION_STATUS, INVOICE_STATUS, CURRENCY } from './constants';
import type { BillingLabelsOverrides } from './labels';

export { BILLING_CYCLE };
export type { BillingCycle } from '../../domain/enums/billing-cycle.enum';

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS];

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS];

export type PlanType = string;

export type Currency = typeof CURRENCY[keyof typeof CURRENCY];

export type PlanFeature = string | { text: string; bold?: boolean; included?: boolean };

export interface PlanTier {
  id: string;
  type?: PlanType;
  name: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: Currency;
  features: PlanFeature[];
  highlight?: boolean;
  maxUsers?: number;
  storageLimit?: number;
  apiLimit?: number;
}

export interface Subscription {
  id: string;
  planId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
  seats?: number;
}

export type PaymentMethodType = 'card' | 'bank_account' | 'wallet';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  isDefault: boolean;
  card?: {
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    name?: string;
  };
  bankAccount?: {
    last4: string;
    bankName: string;
    accountType?: 'checking' | 'savings';
  };
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  paidAt?: string;
  invoiceUrl?: string;
  pdfUrl?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
}

export interface UsageMetric {
  id: string;
  name: string;
  current: number;
  limit: number;
  unit: string;
  resetPeriod: 'daily' | 'monthly' | 'yearly';
  resetAt?: string;
}

export interface BillingSummary {
  subscription: Subscription;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod?: PaymentMethod;
  upcomingInvoice?: {
    amount: number;
    currency: Currency;
    date: string;
  };
  usage: UsageMetric[];
  recentInvoices: Invoice[];
}

export type PaymentMethodInput =
  | {
      type: 'card';
      last4: string;
      brand: string;
      expiryMonth: number;
      expiryYear: number;
      name?: string;
    }
  | {
      type: 'bank_account';
      last4: string;
      bankName: string;
      accountType?: 'checking' | 'savings';
    };

export interface PlanComparisonProps {
  plans: PlanTier[];
  selectedPlan?: string;
  cycle: BillingCycle;
  showCycleToggle?: boolean;
  showFeatures?: boolean;
  onPlanSelect?: (planId: string) => void;
  onCycleChange?: (cycle: BillingCycle) => void;
  loading?: boolean;
  labels?: BillingLabelsOverrides;
}

export interface PaymentMethodsListProps {
  paymentMethods: PaymentMethod[];
  loading?: boolean;
  busyId?: string | null;
  onSetDefault?: (methodId: string) => void;
  onRemove?: (methodId: string) => void;
  onAddNew?: () => void;
}

export interface InvoiceCardProps {
  invoice: Invoice;
  compact?: boolean;
  onClick?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
  locale?: string;
}

export interface UsageCardProps {
  metric: UsageMetric;
  locale?: string;
  showProgress?: boolean;
  showLimit?: boolean;
}

export type BillingTabId = 'overview' | 'payment-methods' | 'invoices' | 'plan';

export interface BillingPortalProps {
  billing: BillingSummary;
  loading?: boolean;
  error?: string;
  showTabs?: boolean;
  activeTab?: BillingTabId;
  locale?: string;
  onTabChange?: (tab: BillingTabId) => void;
  onAddPaymentMethod?: () => void;
  onSetDefaultPaymentMethod?: (methodId: string) => void;
  onRemovePaymentMethod?: (methodId: string) => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onChangePlan?: () => void;
  onCancelSubscription?: () => void | Promise<void>;
  labels?: BillingLabelsOverrides;
}

export interface BillingLayoutProps {
  config: BillingConfig;
  children?: ReactNode;
  onBack?: () => void;
}

export interface BillingConfig {
  brandName: string;
  logo?: ReactNode;
  plans: PlanTier[];
  currencies?: Currency[];
  defaultCurrency?: Currency;
  enableYearlyDiscount?: boolean;
  yearlyDiscount?: number;
  taxRate?: number;
  supportEmail?: string;
  cancelRoute?: string;
  updatePaymentRoute?: string;
  invoiceHistoryRoute?: string;
}

export interface BillingPageProps extends Omit<BillingPortalProps, 'showTabs'> {
  config: BillingConfig;
}
