
import type { VisualTone } from '../../theme/visual-tokens';
import { toMajorUnits } from '../../../domain/utils/minor-units';
import type {
  BillingCycle,
  Invoice,
  InvoiceStatus,
  PlanTier,
  SubscriptionStatus,
  UsageMetric,
} from '../types';

export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  const localeMap: Record<string, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    TRY: 'tr-TR',
    JPY: 'ja-JP',
  };

  return new Intl.NumberFormat(localeMap[currency] ?? 'en-US', {
    style: 'currency',
    currency,
  }).format(toMajorUnits(amount, currency));
}

export function calculateDiscount(monthlyPrice: number, yearlyPrice: number): number {
  if (monthlyPrice <= 0) return 0;
  const yearlyMonthly = yearlyPrice / 12;
  const discount = ((monthlyPrice - yearlyMonthly) / monthlyPrice) * 100;
  return Math.round(Math.max(discount, 0));
}

export function calculateProratedAmount(
  amount: number,
  daysUsed: number,
  totalDays: number,
): number {
  if (totalDays === 0) return 0;
  return (amount / totalDays) * daysUsed;
}

export function getPlanPrice(plan: PlanTier, cycle: BillingCycle): number {
  return cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
}

export function calculateUsagePercentage(metric: UsageMetric): number {
  if (metric.limit === 0) return 0;
  return Math.min((metric.current / metric.limit) * 100, 100);
}

export function isNearLimit(metric: UsageMetric, threshold: number = 80): boolean {
  return calculateUsagePercentage(metric) >= threshold;
}

export function getStatusTone(status: SubscriptionStatus): VisualTone {
  const toneMap: Record<SubscriptionStatus, VisualTone> = {
    active: 'active',
    trialing: 'active',
    past_due: 'warning',
    canceled: 'neutral',
    unpaid: 'danger',
    incomplete: 'warning',
    revoked: 'danger',
  };
  return toneMap[status] ?? 'neutral';
}

export function getStatusLabel(status: SubscriptionStatus): string {
  const labelMap: Record<SubscriptionStatus, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
    revoked: 'Revoked',
  };
  return labelMap[status] || status;
}

export function getInvoiceStatusTone(status: InvoiceStatus): VisualTone {
  const toneMap: Record<InvoiceStatus, VisualTone> = {
    draft: 'neutral',
    open: 'warning',
    paid: 'active',
    void: 'neutral',
    uncollectible: 'danger',
    refunded: 'neutral',
  };
  return toneMap[status] ?? 'neutral';
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labelMap: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    open: 'Open',
    paid: 'Paid',
    void: 'Void',
    uncollectible: 'Uncollectible',
    refunded: 'Refunded',
  };
  return labelMap[status] || status;
}

export function formatCardNumber(last4: string, brand: string): string {
  return `${brand.toUpperCase()} •••• ${last4}`;
}

export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, '0')}/${String(year).slice(-2)}`;
}

export function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialExpiringSoon(trialEnd: string, daysThreshold: number = 7): boolean {
  const daysRemaining = getDaysRemaining(trialEnd);
  return daysRemaining > 0 && daysRemaining <= daysThreshold;
}

export function getNextBillingDate(currentPeriodEnd: string, cycle: BillingCycle): Date {
  const nextDate = new Date(currentPeriodEnd);

  if (cycle === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  return nextDate;
}

export function groupInvoicesByStatus(invoices: Invoice[]): Record<InvoiceStatus, Invoice[]> {
  const grouped: Record<InvoiceStatus, Invoice[]> = {
    draft: [],
    open: [],
    paid: [],
    void: [],
    uncollectible: [],
    refunded: [],
  };

  invoices.forEach((invoice) => {
    grouped[invoice.status].push(invoice);
  });

  return grouped;
}

export function calculateInvoiceTotal(invoices: Invoice[], status?: InvoiceStatus): number {
  const filtered = status ? invoices.filter((inv) => inv.status === status) : invoices;
  return filtered.reduce((sum, inv) => sum + inv.amount, 0);
}

export function sortInvoicesByDate(invoices: Invoice[], order: 'asc' | 'desc' = 'desc'): Invoice[] {
  return [...invoices].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

export function formatFeature(
  feature: string | { text: string; bold?: boolean; included?: boolean },
): { text: string; bold?: boolean; included?: boolean } {
  if (typeof feature === 'string') {
    return { text: feature, included: true };
  }
  return feature;
}

export function isPopularPlan(plan: PlanTier, plans: PlanTier[]): boolean {
  const middleIndex = Math.floor(plans.length / 2);
  return plans[middleIndex]?.id === plan.id;
}

export function getTrialDaysText(trialEnd: string): string {
  const days = getDaysRemaining(trialEnd);

  if (days === 0) return 'Trial ends today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}
