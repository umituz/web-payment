import { minorUnitDivisor } from './minor-units';

export const CURRENCIES = ['USD', 'EUR', 'TRY', 'KRW', 'GBP', 'JPY'] as const;

export type SupportedCurrency = (typeof CURRENCIES)[number];

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  locale: string;
  isZeroDecimal: boolean;
}

const CURRENCY_SET: ReadonlySet<string> = new Set<string>(CURRENCIES);

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: '$ USD (US Dollar)', locale: 'en-US', isZeroDecimal: false },
  EUR: { code: 'EUR', symbol: '€', label: '€ EUR (Euro)', locale: 'de-DE', isZeroDecimal: false },
  TRY: { code: 'TRY', symbol: '₺', label: '₺ TRY (Türk Lirası)', locale: 'tr-TR', isZeroDecimal: false },
  KRW: { code: 'KRW', symbol: '₩', label: '₩ KRW (대한민국 원)', locale: 'ko-KR', isZeroDecimal: true },
  GBP: { code: 'GBP', symbol: '£', label: '£ GBP (British Pound)', locale: 'en-GB', isZeroDecimal: false },
  JPY: { code: 'JPY', symbol: '¥', label: '¥ JPY (日本円)', locale: 'ja-JP', isZeroDecimal: true },
};

export const DEFAULT_EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  USD: 1.0,
  EUR: 0.92,
  TRY: 35.0,
  KRW: 1400.0,
  GBP: 0.78,
  JPY: 155.0,
};

export const DEFAULT_LANGUAGE_CURRENCY_MAP: Record<string, SupportedCurrency> = {
  tr: 'TRY',
  en: 'USD',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  it: 'EUR',
  ko: 'KRW',
  ja: 'JPY',
  zh: 'USD',
  ru: 'USD',
  ar: 'USD',
  th: 'USD',
};

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && CURRENCY_SET.has(value.toUpperCase());
}

export function isZeroDecimalCurrency(currency: string): boolean {
  return minorUnitDivisor(currency) === 1;
}

function normalizeCurrencyCode(value: string): SupportedCurrency {
  const upper = value.toUpperCase();
  return isSupportedCurrency(upper) ? upper : 'USD';
}

export function convertAmount(
  amount: number,
  from: string = 'USD',
  to: string = 'USD',
  rates: Record<string, number> = DEFAULT_EXCHANGE_RATES,
): number {
  const fromCurrency = normalizeCurrencyCode(from);
  const toCurrency = normalizeCurrencyCode(to);
  if (fromCurrency === toCurrency) return amount;
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  const inUsd = amount / fromRate;
  const converted = inUsd * toRate;
  if (isZeroDecimalCurrency(toCurrency)) {
    const rounded = Math.round(converted / 100) * 100;
    return rounded !== 0 ? rounded : Math.round(converted);
  }
  return Math.round(converted);
}

export function currencyForLanguage(
  language: string = 'en',
  map: Record<string, string> = DEFAULT_LANGUAGE_CURRENCY_MAP,
): SupportedCurrency {
  const segments = language.toLowerCase().split('-');
  const code = segments[0] ?? '';
  const mapped = map[code];
  return isSupportedCurrency(mapped) ? mapped : 'USD';
}
