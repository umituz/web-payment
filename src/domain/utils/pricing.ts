import { CURRENCY_CONFIGS, isSupportedCurrency } from './currency';
import { toMajorUnits, minorUnitDivisor } from './minor-units';

export interface FormatPriceOptions {
  locale?: string;
  showZeroCents?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatPrice(
  amountMinor: number,
  currency: string = 'USD',
  options?: FormatPriceOptions,
): string {
  const code = (currency || 'USD').toUpperCase();
  const config = isSupportedCurrency(code) ? CURRENCY_CONFIGS[code] : undefined;
  const targetLocale = options?.locale ?? config?.locale ?? 'en-US';
  const isZeroDec = config ? config.isZeroDecimal : minorUnitDivisor(code) === 1;
  const major = toMajorUnits(amountMinor, code);

  let minDigits = options?.minimumFractionDigits;
  let maxDigits = options?.maximumFractionDigits;

  if (minDigits === undefined && maxDigits === undefined) {
    if (isZeroDec) {
      minDigits = 0;
      maxDigits = 0;
    } else if (options?.showZeroCents === false && Math.round(major) === major) {
      minDigits = 0;
      maxDigits = 0;
    } else {
      minDigits = 2;
      maxDigits = 2;
    }
  }

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(major);
  } catch {
    const symbol = config?.symbol ?? code;
    return `${symbol}${major}`;
  }
}

export function calculateDiscount(monthlyPrice: number, yearlyPrice: number): number {
  if (monthlyPrice <= 0) return 0;
  const yearlyMonthly = yearlyPrice / 12;
  const discount = ((monthlyPrice - yearlyMonthly) / monthlyPrice) * 100;
  return Math.round(Math.max(discount, 0));
}

export interface AnnualSavings {
  savingsPercent: number;
  savedMinor: number;
  monthlyEquivalentMinor: number;
  annualEquivalentMinor: number;
}

export function calculateAnnualSavings(
  monthlyPriceMinor: number,
  annualPriceMinor: number,
): AnnualSavings {
  if (!Number.isFinite(monthlyPriceMinor) || monthlyPriceMinor <= 0) {
    return {
      savingsPercent: 0,
      savedMinor: 0,
      monthlyEquivalentMinor: Math.max(0, Math.round(annualPriceMinor / 12)),
      annualEquivalentMinor: 0,
    };
  }
  const annualEquivalentMinor = Math.round(monthlyPriceMinor * 12);
  const savedMinor = Math.max(0, annualEquivalentMinor - Math.max(0, annualPriceMinor));
  const savingsPercent = annualEquivalentMinor > 0
    ? Math.round((savedMinor / annualEquivalentMinor) * 100)
    : 0;
  const monthlyEquivalentMinor = Math.max(0, Math.round(annualPriceMinor / 12));

  return {
    savingsPercent,
    savedMinor,
    monthlyEquivalentMinor,
    annualEquivalentMinor,
  };
}

export function calculateDiscountPercent(
  originalMinor: number,
  discountedMinor: number,
): number {
  if (!Number.isFinite(originalMinor) || originalMinor <= 0) return 0;
  if (!Number.isFinite(discountedMinor) || discountedMinor <= 0) return 100;
  if (discountedMinor >= originalMinor) return 0;
  return Math.round(((originalMinor - discountedMinor) / originalMinor) * 100);
}

export function calculateDiscountAmount(
  originalMinor: number,
  discountPercent: number,
): number {
  if (!Number.isFinite(originalMinor) || originalMinor <= 0) return 0;
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) return 0;
  const clampedPercent = Math.min(100, discountPercent);
  return Math.round((originalMinor * clampedPercent) / 100);
}

export type PaymentVisualTone = 'active' | 'warning' | 'neutral' | 'danger';

const INVOICE_STATUS_TONE_MAP: Record<string, PaymentVisualTone> = {
  draft: 'neutral',
  open: 'warning',
  paid: 'active',
  void: 'neutral',
  uncollectible: 'danger',
  refunded: 'neutral',
};

const INVOICE_STATUS_LABEL_MAP: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  paid: 'Paid',
  void: 'Void',
  uncollectible: 'Uncollectible',
  refunded: 'Refunded',
};

export function resolveInvoiceStatusTone(status: string): PaymentVisualTone {
  const normalized = (status || '').toLowerCase();
  return INVOICE_STATUS_TONE_MAP[normalized] ?? 'neutral';
}

export function resolveInvoiceStatusLabel(status: string): string {
  const normalized = (status || '').toLowerCase();
  return INVOICE_STATUS_LABEL_MAP[normalized] ?? status;
}
